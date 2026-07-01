import { pgTable, text, serial, timestamp, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const registrationsTable = pgTable("registrations", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  mobileNumber: text("mobile_number").notNull().unique(),
  dateOfBirth: date("date_of_birth").notNull(),
  email: text("email"),
  gender: text("gender").notNull(),
  profession: text("profession").notNull(),
  guardianName: text("guardian_name").notNull(),
  guardianMobile: text("guardian_mobile").notNull(),
  address: text("address").notNull(),
  notes: text("notes"),
  photoUrl: text("photo_url"),
  idProofUrl: text("id_proof_url"),
  status: text("status").notNull().default("pending"),
  joiningDate: date("joining_date"),
  paymentStatus: text("payment_status"),
  nextPaymentDate: date("next_payment_date"),
  roomId: integer("room_id"),
  bedId: integer("bed_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRegistrationSchema = createInsertSchema(registrationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  joiningDate: true,
  paymentStatus: true,
  nextPaymentDate: true,
  roomId: true,
  bedId: true,
});
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Registration = typeof registrationsTable.$inferSelect;
