import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const uploadedFilesTable = pgTable("uploaded_files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  data: text("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UploadedFile = typeof uploadedFilesTable.$inferSelect;
