import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const reminderLogsTable = pgTable("reminder_logs", {
  id: serial("id").primaryKey(),
  tenantId: integer("tenant_id"),
  tenantName: text("tenant_name").notNull(),
  mobileNumber: text("mobile_number").notNull(),
  message: text("message").notNull(),
  rentDue: integer("rent_due").notNull().default(7000),
  outstandingDue: integer("outstanding_due").notNull().default(0),
  otherBillsDue: integer("other_bills_due").notNull().default(0),
  totalDue: integer("total_due").notNull().default(7000),
  status: text("status").notNull().default("sent"), // sent, delivered, failed
  provider: text("provider").notNull().default("whatsapp_gateway"),
  error: text("error"),
  sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ReminderLog = typeof reminderLogsTable.$inferSelect;
