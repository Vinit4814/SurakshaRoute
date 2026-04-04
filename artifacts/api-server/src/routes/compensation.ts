import { Router, type IRouter } from "express";
import { eq, and, avg } from "drizzle-orm";
import { db, compensationRequestsTable, workersTable, emergenciesTable, earningsTable } from "@workspace/db";
import {
  ListCompensationRequestsQueryParams,
  CreateCompensationRequestBody,
  GetCompensationRequestParams,
  UpdateCompensationRequestParams,
  UpdateCompensationRequestBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichCompensation(req: typeof compensationRequestsTable.$inferSelect) {
  const worker = await db.select({ name: workersTable.name }).from(workersTable).where(eq(workersTable.id, req.workerId));
  const workerName = worker[0]?.name ?? null;

  let emergencyType = null;
  if (req.emergencyId) {
    const em = await db.select({ type: emergenciesTable.type }).from(emergenciesTable).where(eq(emergenciesTable.id, req.emergencyId));
    emergencyType = em[0]?.type ?? null;
  }

  const [stats] = await db
    .select({ avgEarning: avg(earningsTable.amount) })
    .from(earningsTable)
    .where(eq(earningsTable.workerId, req.workerId));

  const averageDailyEarning = parseFloat(stats?.avgEarning ?? "0") || 0;

  return { ...req, workerName, emergencyType, averageDailyEarning };
}

router.get("/compensation", async (req, res): Promise<void> => {
  const query = ListCompensationRequestsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.status) conditions.push(eq(compensationRequestsTable.status, query.data.status));
  if (query.data.workerId) conditions.push(eq(compensationRequestsTable.workerId, query.data.workerId));

  let rows;
  if (conditions.length > 0) {
    const { and } = await import("drizzle-orm");
    rows = await db.select().from(compensationRequestsTable).where(and(...conditions));
  } else {
    rows = await db.select().from(compensationRequestsTable);
  }

  const enriched = await Promise.all(rows.map(enrichCompensation));
  res.json(enriched);
});

router.post("/compensation", async (req, res): Promise<void> => {
  const parsed = CreateCompensationRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [stats] = await db
    .select({ avgEarning: avg(earningsTable.amount) })
    .from(earningsTable)
    .where(eq(earningsTable.workerId, parsed.data.workerId));

  const averageDailyEarning = parseFloat(stats?.avgEarning ?? "0") || 0;
  const requestedAmount = averageDailyEarning * parsed.data.daysAffected;

  const [created] = await db
    .insert(compensationRequestsTable)
    .values({ ...parsed.data, requestedAmount })
    .returning();

  const enriched = await enrichCompensation(created);
  res.status(201).json(enriched);
});

router.get("/compensation/:requestId", async (req, res): Promise<void> => {
  const params = GetCompensationRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(compensationRequestsTable)
    .where(eq(compensationRequestsTable.id, params.data.requestId));

  if (!row) {
    res.status(404).json({ error: "Compensation request not found" });
    return;
  }

  res.json(await enrichCompensation(row));
});

router.put("/compensation/:requestId", async (req, res): Promise<void> => {
  const params = UpdateCompensationRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateCompensationRequestBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...body.data };
  if (body.data.status && body.data.status !== "pending") {
    updateData.resolvedAt = new Date();
  }

  const [updated] = await db
    .update(compensationRequestsTable)
    .set(updateData)
    .where(eq(compensationRequestsTable.id, params.data.requestId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Compensation request not found" });
    return;
  }

  res.json(await enrichCompensation(updated));
});

export default router;
