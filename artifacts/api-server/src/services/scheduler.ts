import { db, registrationsTable } from "@workspace/db";
import { isNotNull, and, lte, or, ne, isNull } from "drizzle-orm";
import { sendWhatsAppMessage } from "./whatsapp";
import { logger } from "../lib/logger";

export async function checkAndSendMonthlyDueReminders(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  details: any[];
}> {
  const today = new Date().toISOString().split("T")[0];

  logger.info({ today }, "Running automated monthly due reminder scan...");

  // Find all active tenants (assigned to a bed) whose payment is due today or overdue and not marked as paid
  const dueTenants = await db
    .select()
    .from(registrationsTable)
    .where(
      and(
        isNotNull(registrationsTable.bedId),
        or(
          and(
            isNotNull(registrationsTable.nextPaymentDate),
            lte(registrationsTable.nextPaymentDate, today),
            or(
              isNull(registrationsTable.paymentStatus),
              ne(registrationsTable.paymentStatus, "paid")
            )
          ),
          and(
            isNull(registrationsTable.nextPaymentDate),
            isNotNull(registrationsTable.joiningDate),
            lte(registrationsTable.joiningDate, today),
            or(
              isNull(registrationsTable.paymentStatus),
              ne(registrationsTable.paymentStatus, "paid")
            )
          )
        )
      )
    );

  logger.info({ count: dueTenants.length }, "Found tenants with due payments for automated WhatsApp dispatch");

  let sentCount = 0;
  let failedCount = 0;
  const details: any[] = [];

  for (const tenant of dueTenants) {
    try {
      const result = await sendWhatsAppMessage({
        tenantId: tenant.id,
        fullName: tenant.fullName,
        mobileNumber: tenant.mobileNumber,
        rentDue: 7000,
        outstandingDue: 0,
        otherBillsDue: 0,
      });

      if (result.success) {
        sentCount++;
      } else {
        failedCount++;
      }

      details.push({
        tenantId: tenant.id,
        fullName: tenant.fullName,
        mobileNumber: tenant.mobileNumber,
        status: result.status,
        provider: result.provider,
        error: result.error,
      });
    } catch (err: any) {
      failedCount++;
      logger.error({ err, tenantId: tenant.id }, "Error sending automatic reminder to tenant");
      details.push({
        tenantId: tenant.id,
        fullName: tenant.fullName,
        mobileNumber: tenant.mobileNumber,
        status: "failed",
        error: err?.message || String(err),
      });
    }
  }

  return {
    processed: dueTenants.length,
    sent: sentCount,
    failed: failedCount,
    details,
  };
}

let schedulerTimer: NodeJS.Timeout | null = null;

export function startAutomatedReminderScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }

  // Initial check on server startup (delayed 10s to let DB warm up)
  setTimeout(() => {
    checkAndSendMonthlyDueReminders().catch((err) =>
      logger.error({ err }, "Initial automated reminder check failed"),
    );
  }, 10000);

  // Run periodic automated scan every 4 hours (ensures daily coverage across restarts)
  const INTERVAL_MS = 4 * 60 * 60 * 1000;
  schedulerTimer = setInterval(() => {
    checkAndSendMonthlyDueReminders().catch((err) =>
      logger.error({ err }, "Scheduled automated reminder check failed"),
    );
  }, INTERVAL_MS);

  logger.info("Automated WhatsApp payment due reminder scheduler started");
}
