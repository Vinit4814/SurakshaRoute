import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const accidentsTable = pgTable("accidents", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  severity: text("severity").notNull().default("minor"),
  injuryType: text("injury_type"),
  status: text("status").notNull().default("reported"),
  nextStep: text("next_step"),
  insuranceClaimId: integer("insurance_claim_id"),
  reportedAt: timestamp("reported_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAccidentSchema = createInsertSchema(accidentsTable).omit({ id: true, reportedAt: true, updatedAt: true });
export type InsertAccident = z.infer<typeof insertAccidentSchema>;
export type Accident = typeof accidentsTable.$inferSelect;
