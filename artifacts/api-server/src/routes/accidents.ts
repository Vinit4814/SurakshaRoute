import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, accidentsTable, workersTable } from "@workspace/db";
import {
  ListAccidentsQueryParams,
  ReportAccidentBody,
  GetAccidentParams,
  UpdateAccidentParams,
  UpdateAccidentBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichAccident(accident: typeof accidentsTable.$inferSelect) {
  const worker = await db.select({ name: workersTable.name }).from(workersTable).where(eq(workersTable.id, accident.workerId));
  return { ...accident, workerName: worker[0]?.name ?? null };
}

router.get("/accidents", async (req, res): Promise<void> => {
  const query = ListAccidentsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.status) conditions.push(eq(accidentsTable.status, query.data.status));
  if (query.data.workerId) conditions.push(eq(accidentsTable.workerId, query.data.workerId));

  let rows;
  if (conditions.length > 0) {
    const { and } = await import("drizzle-orm");
    rows = await db.select().from(accidentsTable).where(and(...conditions));
  } else {
    rows = await db.select().from(accidentsTable);
  }

  const enriched = await Promise.all(rows.map(enrichAccident));
  res.json(enriched);
});

router.post("/accidents", async (req, res): Promise<void> => {
  const parsed = ReportAccidentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const severitySteps: Record<string, string> = {
    minor: "Visit a nearby medical center for first aid. Rest for the day.",
    moderate: "Seek medical attention at a hospital. File an insurance claim.",
    severe: "Call emergency services immediately. Contact supervisor and file insurance claim.",
    critical: "Emergency services have been notified. Contact family. Admin will assist immediately.",
  };

  const [created] = await db
    .insert(accidentsTable)
    .values({
      ...parsed.data,
      nextStep: severitySteps[parsed.data.severity] ?? "Please contact your supervisor.",
    })
    .returning();

  res.status(201).json(await enrichAccident(created));
});

router.get("/accidents/:accidentId", async (req, res): Promise<void> => {
  const params = GetAccidentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db.select().from(accidentsTable).where(eq(accidentsTable.id, params.data.accidentId));

  if (!row) {
    res.status(404).json({ error: "Accident not found" });
    return;
  }

  res.json(await enrichAccident(row));
});

router.put("/accidents/:accidentId", async (req, res): Promise<void> => {
  const params = UpdateAccidentParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateAccidentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db
    .update(accidentsTable)
    .set(body.data)
    .where(eq(accidentsTable.id, params.data.accidentId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Accident not found" });
    return;
  }

  res.json(await enrichAccident(updated));
});

export default router;
