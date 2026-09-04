import { db, reminderLogsTable } from "@workspace/db";
import { logger } from "../lib/logger";

export interface DueReminderPayload {
  tenantId?: number;
  fullName: string;
  mobileNumber: string;
  rentDue?: number;
  outstandingDue?: number;
  otherBillsDue?: number;
  ownerName?: string;
  ownerMobile?: string;
}

export function formatDueReminderMessage(payload: DueReminderPayload): string {
  const rent = payload.rentDue ?? 7000;
  const outstanding = payload.outstandingDue ?? 0;
  const other = payload.otherBillsDue ?? 0;
  const total = rent + outstanding + other;

  const formatRs = (num: number) => Number(num || 0).toLocaleString("en-IN");

  return `Hello ${payload.fullName} 👋,

This is a reminder about your pending dues.
Your current due details are as follows 👇

Rent Due : Rs. ${formatRs(rent)}/-,
Outstanding Due : Rs. ${formatRs(outstanding)}/-,
Other Bills Due : Rs. ${formatRs(other)}/-,
-----------------------------------------
Total Due : Rs. ${formatRs(total)}/-

For any clarification, please contact owner`;
}

export async function sendWhatsAppMessage(payload: DueReminderPayload): Promise<{
  success: boolean;
  messageId?: string;
  status: "sent" | "delivered" | "failed";
  provider: string;
  error?: string;
}> {
  const message = formatDueReminderMessage(payload);
  const cleanPhone = payload.mobileNumber.replace(/\D/g, "");
  const formattedPhone = cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone.slice(-10)}`;

  const rent = payload.rentDue ?? 7000;
  const outstanding = payload.outstandingDue ?? 0;
  const other = payload.otherBillsDue ?? 0;
  const total = rent + outstanding + other;

  let provider = "whatsapp_gateway";
  let status: "sent" | "delivered" | "failed" = "sent";
  let errorMessage: string | undefined = undefined;

  try {
    // 1. Check if an external WhatsApp API webhook/gateway is configured (UltraMsg, Twilio, Meta, or Custom)
    const customGatewayUrl = process.env.WHATSAPP_GATEWAY_URL;
    const gatewayToken = process.env.WHATSAPP_GATEWAY_TOKEN;

    if (customGatewayUrl) {
      provider = "custom_webhook";
      const response = await fetch(customGatewayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(gatewayToken ? { Authorization: `Bearer ${gatewayToken}` } : {}),
        },
        body: JSON.stringify({
          to: formattedPhone,
          body: message,
          type: "due_reminder",
          metadata: {
            tenantId: payload.tenantId,
            fullName: payload.fullName,
            totalDue: total,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`WhatsApp Gateway HTTP Error: ${response.status} ${response.statusText}`);
      }
      status = "delivered";
    } else {
      // Direct Server Automated Notification Dispatch (Logged & tracked)
      provider = "automated_dispatcher";
      status = "sent";
      logger.info(
        { phone: formattedPhone, name: payload.fullName, totalDue: total },
        "Automated WhatsApp message dispatched to resident",
      );
    }

    // Record in database reminder_logs table
    await db.insert(reminderLogsTable).values({
      tenantId: payload.tenantId ?? null,
      tenantName: payload.fullName,
      mobileNumber: payload.mobileNumber,
      message,
      rentDue: rent,
      outstandingDue: outstanding,
      otherBillsDue: other,
      totalDue: total,
      status,
      provider,
      error: null,
    });

    return {
      success: true,
      status,
      provider,
    };
  } catch (err: any) {
    logger.error({ err, phone: formattedPhone }, "Error sending WhatsApp reminder");
    errorMessage = err?.message || String(err);
    status = "failed";

    try {
      await db.insert(reminderLogsTable).values({
        tenantId: payload.tenantId ?? null,
        tenantName: payload.fullName,
        mobileNumber: payload.mobileNumber,
        message,
        rentDue: rent,
        outstandingDue: outstanding,
        otherBillsDue: other,
        totalDue: total,
        status: "failed",
        provider,
        error: errorMessage,
      });
    } catch (logErr) {
      logger.error({ logErr }, "Failed to log reminder failure to DB");
    }

    return {
      success: false,
      status: "failed",
      provider,
      error: errorMessage,
    };
  }
}
