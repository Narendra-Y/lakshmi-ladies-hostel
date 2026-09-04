import { Router, type IRouter } from "express";
import { db, reminderLogsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { sendWhatsAppMessage, formatDueReminderMessage } from "../services/whatsapp";
import { checkAndSendMonthlyDueReminders } from "../services/scheduler";

const router: IRouter = Router();

// Test endpoint: Send test WhatsApp reminder to a specific number (e.g. 6302661388)
router.post("/reminders/test-whatsapp", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const {
    mobileNumber = "6302661388",
    fullName = "Narendra Y",
    rentDue = 7000,
    outstandingDue = 0,
    otherBillsDue = 0,
  } = req.body || {};

  try {
    const result = await sendWhatsAppMessage({
      fullName,
      mobileNumber,
      rentDue: Number(rentDue) || 7000,
      outstandingDue: Number(outstandingDue) || 0,
      otherBillsDue: Number(otherBillsDue) || 0,
    });

    const formattedMessage = formatDueReminderMessage({
      fullName,
      mobileNumber,
      rentDue: Number(rentDue) || 7000,
      outstandingDue: Number(outstandingDue) || 0,
      otherBillsDue: Number(otherBillsDue) || 0,
    });

    const cleanPhone = String(mobileNumber).replace(/\D/g, "");
    const formattedPhone = cleanPhone.length > 10 ? cleanPhone : `91${cleanPhone.slice(-10)}`;
    const directUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(formattedMessage)}`;

    res.json({
      success: result.success,
      status: result.status,
      provider: result.provider,
      mobileNumber,
      message: formattedMessage,
      directUrl,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to dispatch test reminder" });
  }
});

// Trigger automated monthly check on demand
router.post("/reminders/trigger-auto", requireAuth, async (_req: AuthRequest, res): Promise<void> => {
  try {
    const summary = await checkAndSendMonthlyDueReminders();
    res.json({
      success: true,
      message: `Automated reminder check completed. Processed ${summary.processed} due tenants (${summary.sent} sent, ${summary.failed} failed).`,
      summary,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to run automated reminder check" });
  }
});

// Get recent reminder logs
router.get("/reminders/logs", requireAuth, async (_req: AuthRequest, res): Promise<void> => {
  try {
    const logs = await db
      .select()
      .from(reminderLogsTable)
      .orderBy(desc(reminderLogsTable.sentAt))
      .limit(50);

    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to fetch reminder logs" });
  }
});

export default router;
