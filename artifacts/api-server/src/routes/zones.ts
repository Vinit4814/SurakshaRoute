import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, zonesTable, workersTable, emergenciesTable } from "@workspace/db";
import {
  CreateZoneBody,
  GetZoneParams,
  UpdateZoneParams,
  UpdateZoneBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function computeRiskLevel(score: number): string {
  if (score >= 80) return "critical";
  if (score >= 60) return "high";
  if (score >= 30) return "moderate";
  return "safe";
}

router.get("/zones", async (_req, res): Promise<void> => {
  const zones = await db.select().from(zonesTable);

  const zonesWithStats = await Promise.all(
    zones.map(async (z) => {
      const [wc] = await db
        .select({ cnt: count() })
        .from(workersTable)
        .where(eq(workersTable.zoneId, z.id));

      const [ec] = await db
        .select({ cnt: count() })
        .from(emergenciesTable)
        .where(eq(emergenciesTable.zoneId, z.id));

      return {
        ...z,
        workerCount: wc?.cnt ?? 0,
        activeEmergencies: ec?.cnt ?? 0,
      };
    })
  );

  res.json(zonesWithStats);
});

router.post("/zones", async (req, res): Promise<void> => {
  const parsed = CreateZoneBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const riskScore = parsed.data.riskScore ?? 0;
  const riskLevel = computeRiskLevel(riskScore);

  const [zone] = await db
    .insert(zonesTable)
    .values({ ...parsed.data, riskScore, riskLevel })
    .returning();

  res.status(201).json({ ...zone, workerCount: 0, activeEmergencies: 0 });
});

router.get("/zones/:zoneId", async (req, res): Promise<void> => {
  const params = GetZoneParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [zone] = await db.select().from(zonesTable).where(eq(zonesTable.id, params.data.zoneId));

  if (!zone) {
    res.status(404).json({ error: "Zone not found" });
    return;
  }

  const [wc] = await db.select({ cnt: count() }).from(workersTable).where(eq(workersTable.zoneId, zone.id));
  const [ec] = await db.select({ cnt: count() }).from(emergenciesTable).where(eq(emergenciesTable.zoneId, zone.id));

  res.json({ ...zone, workerCount: wc?.cnt ?? 0, activeEmergencies: ec?.cnt ?? 0 });
});

router.put("/zones/:zoneId", async (req, res): Promise<void> => {
  const params = UpdateZoneParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateZoneBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...body.data, lastUpdated: new Date() };
  if (body.data.riskScore !== undefined && !body.data.riskLevel) {
    updateData.riskLevel = computeRiskLevel(body.data.riskScore);
  }

  const [updated] = await db
    .update(zonesTable)
    .set(updateData)
    .where(eq(zonesTable.id, params.data.zoneId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Zone not found" });
    return;
  }

  const [wc] = await db.select({ cnt: count() }).from(workersTable).where(eq(workersTable.zoneId, updated.id));
  const [ec] = await db.select({ cnt: count() }).from(emergenciesTable).where(eq(emergenciesTable.zoneId, updated.id));

  res.json({ ...updated, workerCount: wc?.cnt ?? 0, activeEmergencies: ec?.cnt ?? 0 });
});

export default router;
