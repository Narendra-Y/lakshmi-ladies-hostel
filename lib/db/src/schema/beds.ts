import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { roomsTable } from "./rooms";
import { registrationsTable } from "./registrations";

export const bedsTable = pgTable("beds", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id")
    .notNull()
    .references(() => roomsTable.id, { onDelete: "cascade" }),
  bedNumber: integer("bed_number").notNull(),
  status: text("status").notNull().default("vacant"),
  tenantId: integer("tenant_id").references(() => registrationsTable.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Bed = typeof bedsTable.$inferSelect;
export type InsertBed = typeof bedsTable.$inferInsert;
