import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const safetyAlertsTable = pgTable("safety_alerts", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull(),
  alertType: text("alert_type").notNull(),
  message: text("message"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSafetyAlertSchema = createInsertSchema(safetyAlertsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSafetyAlert = z.infer<typeof insertSafetyAlertSchema>;
export type SafetyAlert = typeof safetyAlertsTable.$inferSelect;
