import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";

export const roomsTable = pgTable("rooms", {
  id: serial("id").primaryKey(),
  roomNumber: integer("room_number").notNull().unique(),
  totalBeds: integer("total_beds").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Room = typeof roomsTable.$inferSelect;
export type InsertRoom = typeof roomsTable.$inferInsert;
