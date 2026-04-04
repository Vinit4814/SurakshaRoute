import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const emergenciesTable = pgTable("emergencies", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  zoneId: integer("zone_id"),
  status: text("status").notNull().default("active"),
  severity: text("severity").notNull().default("medium"),
  reportedAt: timestamp("reported_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEmergencySchema = createInsertSchema(emergenciesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEmergency = z.infer<typeof insertEmergencySchema>;
export type Emergency = typeof emergenciesTable.$inferSelect;
