import { Router, type IRouter } from "express";
import { eq, and, count, avg, sum, desc, gte } from "drizzle-orm";
import { db, workersTable, emergenciesTable, zonesTable, compensationRequestsTable, complaintsTable, accidentsTable, insuranceClaimsTable, safetyAlertsTable, earningsTable, notificationsTable } from "@workspace/db";
import {
  GetWorkerDashboardParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [totalWorkers] = await db.select({ cnt: count() }).from(workersTable);
  const [activeWorkers] = await db.select({ cnt: count() }).from(workersTable).where(eq(workersTable.status, "active"));
  const [activeEmergencies] = await db.select({ cnt: count() }).from(emergenciesTable).where(eq(emergenciesTable.status, "active"));
  const [blockedZones] = await db.select({ cnt: count() }).from(zonesTable).where(eq(zonesTable.isBlocked, true));
  const [pendingCompensations] = await db.select({ cnt: count() }).from(compensationRequestsTable).where(eq(compensationRequestsTable.status, "pending"));
  const [pendingComplaints] = await db.select({ cnt: count() }).from(complaintsTable).where(eq(complaintsTable.status, "open"));
  const [openAccidents] = await db.select({ cnt: count() }).from(accidentsTable).where(eq(accidentsTable.status, "reported"));
  const [pendingInsuranceClaims] = await db.select({ cnt: count() }).from(insuranceClaimsTable).where(eq(insuranceClaimsTable.status, "submitted"));
  const [criticalZones] = await db.select({ cnt: count() }).from(zonesTable).where(eq(zonesTable.riskLevel, "critical"));

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [paidThisMonth] = await db
    .select({ total: sum(compensationRequestsTable.approvedAmount) })
    .from(compensationRequestsTable)
    .where(and(eq(compensationRequestsTable.status, "paid"), gte(compensationRequestsTable.submittedAt, monthStart)));

  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const [recentAlerts] = await db
    .select({ cnt: count() })
    .from(safetyAlertsTable)
    .where(gte(safetyAlertsTable.createdAt, last24h));

  res.json({
    totalWorkers: totalWorkers?.cnt ?? 0,
    activeWorkers: activeWorkers?.cnt ?? 0,
    activeEmergencies: activeEmergencies?.cnt ?? 0,
    blockedZones: blockedZones?.cnt ?? 0,
    pendingCompensations: pendingCompensations?.cnt ?? 0,
    pendingComplaints: pendingComplaints?.cnt ?? 0,
    openAccidents: openAccidents?.cnt ?? 0,
    pendingInsuranceClaims: pendingInsuranceClaims?.cnt ?? 0,
    totalCompensationPaidThisMonth: parseFloat(paidThisMonth?.total ?? "0") || 0,
    recentSafetyAlerts: recentAlerts?.cnt ?? 0,
    criticalZones: criticalZones?.cnt ?? 0,
  });
});

router.get("/dashboard/worker/:workerId", async (req, res): Promise<void> => {
  const params = GetWorkerDashboardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const workerId = params.data.workerId;

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
    .where(eq(workersTable.id, workerId));

  if (!workerRows[0]) {
    res.status(404).json({ error: "Worker not found" });
    return;
  }

  const worker = workerRows[0];

  const [earningStats] = await db
    .select({
      avgEarning: avg(earningsTable.amount),
      totalEarnings: sum(earningsTable.amount),
      totalDeliveries: sum(earningsTable.deliveries),
      totalDays: count(earningsTable.id),
    })
    .from(earningsTable)
    .where(eq(earningsTable.workerId, workerId));

  const recentEarnings = await db
    .select()
    .from(earningsTable)
    .where(eq(earningsTable.workerId, workerId))
    .orderBy(desc(earningsTable.date))
    .limit(7);

  let activeEmergenciesInZone = 0;
  let zoneStatus = "safe";
  if (worker.zoneId) {
    const [ec] = await db
      .select({ cnt: count() })
      .from(emergenciesTable)
      .where(and(eq(emergenciesTable.zoneId, worker.zoneId), eq(emergenciesTable.status, "active")));
    activeEmergenciesInZone = ec?.cnt ?? 0;

    const zoneRows = await db.select({ riskLevel: zonesTable.riskLevel }).from(zonesTable).where(eq(zonesTable.id, worker.zoneId));
    zoneStatus = zoneRows[0]?.riskLevel ?? "safe";
  }

  const [pendingComp] = await db
    .select({ cnt: count() })
    .from(compensationRequestsTable)
    .where(and(eq(compensationRequestsTable.workerId, workerId), eq(compensationRequestsTable.status, "pending")));

  const [openComp] = await db
    .select({ cnt: count() })
    .from(complaintsTable)
    .where(and(eq(complaintsTable.workerId, workerId), eq(complaintsTable.status, "open")));

  const [unreadNotif] = await db
    .select({ cnt: count() })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.workerId, workerId), eq(notificationsTable.read, false)));

  const recentNotifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.workerId, workerId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(5);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const [thisMonth] = await db
    .select({ total: sum(earningsTable.amount) })
    .from(earningsTable)
    .where(and(eq(earningsTable.workerId, workerId), gte(earningsTable.date, monthStart.toISOString().split("T")[0])));

  res.json({
    worker: {
      ...worker,
      averageDailyEarning: parseFloat(earningStats?.avgEarning ?? "0") || 0,
      totalEarnings: parseFloat(earningStats?.totalEarnings ?? "0") || 0,
      totalDeliveries: parseInt(String(earningStats?.totalDeliveries ?? "0")) || 0,
    },
    earningsSummary: {
      workerId,
      totalEarnings: parseFloat(earningStats?.totalEarnings ?? "0") || 0,
      averageDailyEarning: parseFloat(earningStats?.avgEarning ?? "0") || 0,
      totalDeliveries: parseInt(String(earningStats?.totalDeliveries ?? "0")) || 0,
      totalDaysWorked: earningStats?.totalDays ?? 0,
      last7DaysEarnings: 0,
      last30DaysEarnings: 0,
      earningsThisMonth: parseFloat(thisMonth?.total ?? "0") || 0,
      highestEarningDay: 0,
      lowestEarningDay: 0,
    },
    activeEmergenciesInZone,
    zoneStatus,
    pendingCompensations: pendingComp?.cnt ?? 0,
    openComplaints: openComp?.cnt ?? 0,
    unreadNotifications: unreadNotif?.cnt ?? 0,
    recentEarnings,
    recentNotifications,
  });
});

router.get("/dashboard/zone-risks", async (_req, res): Promise<void> => {
  const zones = await db.select().from(zonesTable);

  const result = await Promise.all(
    zones.map(async (z) => {
      const [wc] = await db.select({ cnt: count() }).from(workersTable).where(eq(workersTable.zoneId, z.id));
      const [ec] = await db.select({ cnt: count() }).from(emergenciesTable).where(and(eq(emergenciesTable.zoneId, z.id), eq(emergenciesTable.status, "active")));

      return {
        id: z.id,
        name: z.name,
        riskScore: z.riskScore,
        riskLevel: z.riskLevel,
        isBlocked: z.isBlocked,
        workerCount: wc?.cnt ?? 0,
        activeEmergencies: ec?.cnt ?? 0,
      };
    })
  );

  res.json(result);
});

router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const activities: Array<{
    id: number;
    type: string;
    title: string;
    description: string;
    severity: string;
    timestamp: Date;
    relatedId: number;
  }> = [];

  const emergencies = await db.select().from(emergenciesTable).orderBy(desc(emergenciesTable.reportedAt)).limit(5);
  emergencies.forEach((e) => {
    activities.push({
      id: e.id,
      type: "emergency",
      title: e.title,
      description: `${e.type.replace(/_/g, " ")} emergency reported`,
      severity: e.severity === "critical" ? "danger" : e.severity === "high" ? "warning" : "info",
      timestamp: e.reportedAt,
      relatedId: e.id,
    });
  });

  const compensations = await db.select().from(compensationRequestsTable).orderBy(desc(compensationRequestsTable.submittedAt)).limit(5);
  compensations.forEach((c) => {
    activities.push({
      id: c.id + 1000,
      type: "compensation",
      title: `Compensation Request #${c.id}`,
      description: `Status: ${c.status}`,
      severity: c.status === "approved" ? "success" : c.status === "rejected" ? "danger" : "info",
      timestamp: c.submittedAt,
      relatedId: c.id,
    });
  });

  const accidents = await db.select().from(accidentsTable).orderBy(desc(accidentsTable.reportedAt)).limit(3);
  accidents.forEach((a) => {
    activities.push({
      id: a.id + 2000,
      type: "accident",
      title: `Accident Report #${a.id}`,
      description: `${a.severity} severity at ${a.location ?? "unknown location"}`,
      severity: a.severity === "critical" || a.severity === "severe" ? "danger" : "warning",
      timestamp: a.reportedAt,
      relatedId: a.id,
    });
  });

  const safetyAlerts = await db.select().from(safetyAlertsTable).orderBy(desc(safetyAlertsTable.createdAt)).limit(3);
  safetyAlerts.forEach((s) => {
    activities.push({
      id: s.id + 3000,
      type: "safety_alert",
      title: `Safety Alert: ${s.alertType.replace(/_/g, " ").toUpperCase()}`,
      description: s.message ?? "Worker sent emergency signal",
      severity: s.alertType === "sos" ? "danger" : "warning",
      timestamp: s.createdAt,
      relatedId: s.id,
    });
  });

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json(activities.slice(0, 15));
});

export default router;
