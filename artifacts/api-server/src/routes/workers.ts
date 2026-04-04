import { Router, type IRouter } from "express";
import { eq, avg, sum, count } from "drizzle-orm";
import { db, workersTable, zonesTable, earningsTable } from "@workspace/db";
import {
  ListWorkersQueryParams,
  CreateWorkerBody,
  GetWorkerParams,
  UpdateWorkerParams,
  UpdateWorkerBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/workers", async (req, res): Promise<void> => {
  const parsed = ListWorkersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, zoneId } = parsed.data;

  let query = db
    .select({
      id: workersTable.id,
      name: workersTable.name,
      phone: workersTable.phone,
      email: workersTable.email,
      vehicleType: workersTable.vehicleType,
      zoneId: workersTable.zoneId,
      zoneName: zonesTable.name,
      status: workersTable.status,
      joinedAt: workersTable.joinedAt,
    })
    .from(workersTable)
    .leftJoin(zonesTable, eq(workersTable.zoneId, zonesTable.id));

  const conditions = [];
  if (status) conditions.push(eq(workersTable.status, status));
  if (zoneId) conditions.push(eq(workersTable.zoneId, zoneId));

  let workers;
  if (conditions.length > 0) {
    const { and } = await import("drizzle-orm");
    workers = await query.where(and(...conditions));
  } else {
    workers = await query;
  }

  const workersWithStats = await Promise.all(
    workers.map(async (w) => {
      const stats = await db
        .select({
          avgEarning: avg(earningsTable.amount),
          totalEarnings: sum(earningsTable.amount),
          totalDeliveries: sum(earningsTable.deliveries),
        })
        .from(earningsTable)
        .where(eq(earningsTable.workerId, w.id));

      return {
        ...w,
        averageDailyEarning: parseFloat(stats[0]?.avgEarning ?? "0") || 0,
        totalEarnings: parseFloat(stats[0]?.totalEarnings ?? "0") || 0,
        totalDeliveries: parseInt(String(stats[0]?.totalDeliveries ?? "0")) || 0,
      };
    })
  );

  res.json(workersWithStats);
});

router.post("/workers", async (req, res): Promise<void> => {
  const parsed = CreateWorkerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [worker] = await db.insert(workersTable).values(parsed.data).returning();

  let zoneName = null;
  if (worker.zoneId) {
    const zone = await db.select({ name: zonesTable.name }).from(zonesTable).where(eq(zonesTable.id, worker.zoneId));
    zoneName = zone[0]?.name ?? null;
  }

  res.status(201).json({ ...worker, zoneName, averageDailyEarning: 0, totalEarnings: 0, totalDeliveries: 0 });
});

router.get("/workers/:workerId", async (req, res): Promise<void> => {
  const params = GetWorkerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const workerRows = await db
    .select({
      id: workersTable.id,
      name: workersTable.name,
      phone: workersTable.phone,
      email: workersTable.email,
      vehicleType: workersTable.vehicleType,
      zoneId: workersTable.zoneId,
      zoneName: zonesTable.name,
      status: workersTable.status,
      joinedAt: workersTable.joinedAt,
    })
    .from(workersTable)
    .leftJoin(zonesTable, eq(workersTable.zoneId, zonesTable.id))
    .where(eq(workersTable.id, params.data.workerId));

  if (!workerRows[0]) {
    res.status(404).json({ error: "Worker not found" });
    return;
  }

  const stats = await db
    .select({
      avgEarning: avg(earningsTable.amount),
      totalEarnings: sum(earningsTable.amount),
      totalDeliveries: sum(earningsTable.deliveries),
    })
    .from(earningsTable)
    .where(eq(earningsTable.workerId, params.data.workerId));

  const worker = {
    ...workerRows[0],
    averageDailyEarning: parseFloat(stats[0]?.avgEarning ?? "0") || 0,
    totalEarnings: parseFloat(stats[0]?.totalEarnings ?? "0") || 0,
    totalDeliveries: parseInt(String(stats[0]?.totalDeliveries ?? "0")) || 0,
  };

  res.json(worker);
});

router.put("/workers/:workerId", async (req, res): Promise<void> => {
  const params = UpdateWorkerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateWorkerBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [updated] = await db
    .update(workersTable)
    .set(body.data)
    .where(eq(workersTable.id, params.data.workerId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Worker not found" });
    return;
  }

  let zoneName = null;
  if (updated.zoneId) {
    const zone = await db.select({ name: zonesTable.name }).from(zonesTable).where(eq(zonesTable.id, updated.zoneId));
    zoneName = zone[0]?.name ?? null;
  }

  res.json({ ...updated, zoneName, averageDailyEarning: 0, totalEarnings: 0, totalDeliveries: 0 });
});

export default router;
