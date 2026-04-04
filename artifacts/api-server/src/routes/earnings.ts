import { Router, type IRouter } from "express";
import { eq, and, gte, lte, avg, sum, count, max, min, desc } from "drizzle-orm";
import { db, earningsTable, workersTable } from "@workspace/db";
import {
  GetWorkerEarningsParams,
  GetWorkerEarningsQueryParams,
  AddEarningParams,
  AddEarningBody,
  GetWorkerEarningsSummaryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/workers/:workerId/earnings", async (req, res): Promise<void> => {
  const params = GetWorkerEarningsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const query = GetWorkerEarningsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [eq(earningsTable.workerId, params.data.workerId)];
  if (query.data.startDate) conditions.push(gte(earningsTable.date, query.data.startDate));
  if (query.data.endDate) conditions.push(lte(earningsTable.date, query.data.endDate));

  const earnings = await db
    .select()
    .from(earningsTable)
    .where(and(...conditions))
    .orderBy(desc(earningsTable.date));

  res.json(earnings);
});

router.post("/workers/:workerId/earnings", async (req, res): Promise<void> => {
  const params = AddEarningParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = AddEarningBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [earning] = await db
    .insert(earningsTable)
    .values({ ...body.data, workerId: params.data.workerId })
    .returning();

  res.status(201).json(earning);
});

router.get("/workers/:workerId/earnings/summary", async (req, res): Promise<void> => {
  const params = GetWorkerEarningsSummaryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const workerId = params.data.workerId;

  const [stats] = await db
    .select({
      avgEarning: avg(earningsTable.amount),
      totalEarnings: sum(earningsTable.amount),
      totalDeliveries: sum(earningsTable.deliveries),
      totalDays: count(earningsTable.id),
      highest: max(earningsTable.amount),
      lowest: min(earningsTable.amount),
    })
    .from(earningsTable)
    .where(eq(earningsTable.workerId, workerId));

  const now = new Date();
  const last7 = new Date(now);
  last7.setDate(last7.getDate() - 7);
  const last30 = new Date(now);
  last30.setDate(last30.getDate() - 30);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [last7Stats] = await db
    .select({ total: sum(earningsTable.amount) })
    .from(earningsTable)
    .where(and(eq(earningsTable.workerId, workerId), gte(earningsTable.date, last7.toISOString().split("T")[0])));

  const [last30Stats] = await db
    .select({ total: sum(earningsTable.amount) })
    .from(earningsTable)
    .where(and(eq(earningsTable.workerId, workerId), gte(earningsTable.date, last30.toISOString().split("T")[0])));

  const [thisMonthStats] = await db
    .select({ total: sum(earningsTable.amount) })
    .from(earningsTable)
    .where(and(eq(earningsTable.workerId, workerId), gte(earningsTable.date, monthStart.toISOString().split("T")[0])));

  res.json({
    workerId,
    totalEarnings: parseFloat(stats?.totalEarnings ?? "0") || 0,
    averageDailyEarning: parseFloat(stats?.avgEarning ?? "0") || 0,
    totalDeliveries: parseInt(String(stats?.totalDeliveries ?? "0")) || 0,
    totalDaysWorked: stats?.totalDays ?? 0,
    last7DaysEarnings: parseFloat(last7Stats?.total ?? "0") || 0,
    last30DaysEarnings: parseFloat(last30Stats?.total ?? "0") || 0,
    earningsThisMonth: parseFloat(thisMonthStats?.total ?? "0") || 0,
    highestEarningDay: parseFloat(stats?.highest ?? "0") || 0,
    lowestEarningDay: parseFloat(stats?.lowest ?? "0") || 0,
  });
});

export default router;
