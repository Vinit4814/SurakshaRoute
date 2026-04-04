import { pgTable, serial, integer, real, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const compensationRequestsTable = pgTable("compensation_requests", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull(),
  emergencyId: integer("emergency_id"),
  requestedAmount: real("requested_amount").notNull().default(0),
  approvedAmount: real("approved_amount"),
  status: text("status").notNull().default("pending"),
  reason: text("reason").notNull(),
  daysAffected: integer("days_affected").notNull().default(1),
  description: text("description"),
  adminNotes: text("admin_notes"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCompensationRequestSchema = createInsertSchema(compensationRequestsTable).omit({ id: true, submittedAt: true, updatedAt: true });
export type InsertCompensationRequest = z.infer<typeof insertCompensationRequestSchema>;
export type CompensationRequest = typeof compensationRequestsTable.$inferSelect;
