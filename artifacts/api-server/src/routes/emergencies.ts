import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { db, emergenciesTable, zonesTable, workersTable } from "@workspace/db";
import {
  ListEmergenciesQueryParams,
  CreateEmergencyBody,
  GetEmergencyParams,
  UpdateEmergencyParams,
  UpdateEmergencyBody,
  SendSafetyAlertParams,
  SendSafetyAlertBody,
  GetWorkerSafetyAlertsParams,
} from "@workspace/api-zod";
import { db as dbConn, safetyAlertsTable, workersTable as wt } from "@workspace/db";

const router: IRouter = Router();

router.get("/emergencies", async (req, res): Promise<void> => {
  const query = ListEmergenciesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.status) conditions.push(eq(emergenciesTable.status, query.data.status));
  if (query.data.zoneId) conditions.push(eq(emergenciesTable.zoneId, query.data.zoneId));

  let emergencies;
  if (conditions.length > 0) {
    const { and } = await import("drizzle-orm");
    emergencies = await db
      .select({
        id: emergenciesTable.id,
        type: emergenciesTable.type,
        title: emergenciesTable.title,
        description: emergenciesTable.description,
        zoneId: emergenciesTable.zoneId,
        zoneName: zonesTable.name,
        status: emergenciesTable.status,
        severity: emergenciesTable.severity,
        reportedAt: emergenciesTable.reportedAt,
        resolvedAt: emergenciesTable.resolvedAt,
      })
      .from(emergenciesTable)
      .leftJoin(zonesTable, eq(emergenciesTable.zoneId, zonesTable.id))
      .where(and(...conditions));
  } else {
    emergencies = await db
      .select({
        id: emergenciesTable.id,
        type: emergenciesTable.type,
        title: emergenciesTable.title,
        description: emergenciesTable.description,
        zoneId: emergenciesTable.zoneId,
        zoneName: zonesTable.name,
        status: emergenciesTable.status,
        severity: emergenciesTable.severity,
        reportedAt: emergenciesTable.reportedAt,
        resolvedAt: emergenciesTable.resolvedAt,
      })
      .from(emergenciesTable)
      .leftJoin(zonesTable, eq(emergenciesTable.zoneId, zonesTable.id));
  }

  const result = await Promise.all(
    emergencies.map(async (e) => {
      let affectedWorkers = 0;
      if (e.zoneId) {
        const [wc] = await db.select({ cnt: count() }).from(workersTable).where(eq(workersTable.zoneId, e.zoneId));
        affectedWorkers = wc?.cnt ?? 0;
      }
      return { ...e, affectedWorkers };
    })
  );

  res.json(result);
});

router.post("/emergencies", async (req, res): Promise<void> => {
  const parsed = CreateEmergencyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [emergency] = await db.insert(emergenciesTable).values(parsed.data).returning();

  let zoneName = null;
  if (emergency.zoneId) {
    const zone = await db.select({ name: zonesTable.name }).from(zonesTable).where(eq(zonesTable.id, emergency.zoneId));
    zoneName = zone[0]?.name ?? null;
  }

  res.status(201).json({ ...emergency, zoneName, affectedWorkers: 0 });
});

router.get("/emergencies/:emergencyId", async (req, res): Promise<void> => {
  const params = GetEmergencyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .select({
      id: emergenciesTable.id,
      type: emergenciesTable.type,
      title: emergenciesTable.title,
      description: emergenciesTable.description,
      zoneId: emergenciesTable.zoneId,
      zoneName: zonesTable.name,
      status: emergenciesTable.status,
      severity: emergenciesTable.severity,
      reportedAt: emergenciesTable.reportedAt,
      resolvedAt: emergenciesTable.resolvedAt,
    })
    .from(emergenciesTable)
    .leftJoin(zonesTable, eq(emergenciesTable.zoneId, zonesTable.id))
    .where(eq(emergenciesTable.id, params.data.emergencyId));

  if (!rows[0]) {
    res.status(404).json({ error: "Emergency not found" });
    return;
  }

  let affectedWorkers = 0;
  if (rows[0].zoneId) {
    const [wc] = await db.select({ cnt: count() }).from(workersTable).where(eq(workersTable.zoneId, rows[0].zoneId));
    affectedWorkers = wc?.cnt ?? 0;
  }

  res.json({ ...rows[0], affectedWorkers });
});

router.put("/emergencies/:emergencyId", async (req, res): Promise<void> => {
  const params = UpdateEmergencyParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateEmergencyBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...body.data };
  if (body.data.status === "resolved") {
    updateData.resolvedAt = new Date();
  }

  const [updated] = await db
    .update(emergenciesTable)
    .set(updateData)
    .where(eq(emergenciesTable.id, params.data.emergencyId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Emergency not found" });
    return;
  }

  let zoneName = null;
  if (updated.zoneId) {
    const zone = await db.select({ name: zonesTable.name }).from(zonesTable).where(eq(zonesTable.id, updated.zoneId));
    zoneName = zone[0]?.name ?? null;
  }

  res.json({ ...updated, zoneName, affectedWorkers: 0 });
});

router.post("/workers/:workerId/safety-alert", async (req, res): Promise<void> => {
  const params = SendSafetyAlertParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SendSafetyAlertBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [alert] = await dbConn
    .insert(safetyAlertsTable)
    .values({ ...body.data, workerId: params.data.workerId })
    .returning();

  const worker = await dbConn.select({ name: wt.name }).from(wt).where(eq(wt.id, params.data.workerId));

  res.status(201).json({ ...alert, workerName: worker[0]?.name ?? null });
});

router.get("/workers/:workerId/safety-alerts", async (req, res): Promise<void> => {
  const params = GetWorkerSafetyAlertsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const alerts = await dbConn
    .select()
    .from(safetyAlertsTable)
    .where(eq(safetyAlertsTable.workerId, params.data.workerId));

  const workerRow = await dbConn.select({ name: wt.name }).from(wt).where(eq(wt.id, params.data.workerId));
  const workerName = workerRow[0]?.name ?? null;

  res.json(alerts.map((a) => ({ ...a, workerName })));
});

export default router;
