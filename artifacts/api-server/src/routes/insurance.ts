import { Router, type IRouter } from "express";
import { eq, and, count, avg } from "drizzle-orm";
import { db, insuranceClaimsTable, workersTable, earningsTable } from "@workspace/db";
import {
  CheckInsuranceEligibilityBody,
  ListInsuranceClaimsQueryParams,
  CreateInsuranceClaimBody,
  GetInsuranceClaimParams,
  UpdateInsuranceClaimParams,
  UpdateInsuranceClaimBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichClaim(claim: typeof insuranceClaimsTable.$inferSelect) {
  const worker = await db.select({ name: workersTable.name }).from(workersTable).where(eq(workersTable.id, claim.workerId));
  return { ...claim, workerName: worker[0]?.name ?? null };
}

router.post("/insurance/check", async (req, res): Promise<void> => {
  const parsed = CheckInsuranceEligibilityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [worker] = await db.select().from(workersTable).where(eq(workersTable.id, parsed.data.workerId));

  if (!worker) {
    res.status(404).json({ error: "Worker not found" });
    return;
  }

  const [earningStats] = await db
    .select({ cnt: count(), avgEarning: avg(earningsTable.amount) })
    .from(earningsTable)
    .where(eq(earningsTable.workerId, parsed.data.workerId));

  const daysWorked = earningStats?.cnt ?? 0;
  const avgEarning = parseFloat(earningStats?.avgEarning ?? "0") || 0;

  const eligibilityFactors: string[] = [];
  const requiredDocuments: string[] = [];
  let eligible = false;
  let reason = "";
  let coverageAmount = 0;

  if (worker.status === "suspended") {
    eligible = false;
    reason = "Worker account is suspended. Reinstate account before applying for insurance.";
  } else if (daysWorked < 30) {
    eligible = false;
    reason = "Worker must have at least 30 days of recorded work history to be eligible.";
    eligibilityFactors.push(`Current recorded days: ${daysWorked}`);
  } else {
    eligible = true;
    coverageAmount = avgEarning * 90;
    reason = "Worker is eligible for insurance coverage based on work history and active status.";
    eligibilityFactors.push(`Active status: ${worker.status}`);
    eligibilityFactors.push(`Days of work history: ${daysWorked}`);
    eligibilityFactors.push(`Average daily earning: ₹${avgEarning.toFixed(0)}`);
    requiredDocuments.push("Government-issued ID (Aadhaar/PAN)");
    requiredDocuments.push("Recent earnings records (last 3 months)");
    requiredDocuments.push("Accident/medical report (if applicable)");
    requiredDocuments.push("Bank account details for claim disbursement");
  }

  res.json({
    workerId: parsed.data.workerId,
    eligible,
    reason,
    coverageAmount,
    eligibilityFactors,
    requiredDocuments,
  });
});

router.get("/insurance/claims", async (req, res): Promise<void> => {
  const query = ListInsuranceClaimsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.workerId) conditions.push(eq(insuranceClaimsTable.workerId, query.data.workerId));
  if (query.data.status) conditions.push(eq(insuranceClaimsTable.status, query.data.status));

  let rows;
  if (conditions.length > 0) {
    const { and } = await import("drizzle-orm");
    rows = await db.select().from(insuranceClaimsTable).where(and(...conditions));
  } else {
    rows = await db.select().from(insuranceClaimsTable);
  }

  const enriched = await Promise.all(rows.map(enrichClaim));
  res.json(enriched);
});

router.post("/insurance/claims", async (req, res): Promise<void> => {
  const parsed = CreateInsuranceClaimBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db.insert(insuranceClaimsTable).values(parsed.data).returning();
  res.status(201).json(await enrichClaim(created));
});

router.get("/insurance/claims/:claimId", async (req, res): Promise<void> => {
  const params = GetInsuranceClaimParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db.select().from(insuranceClaimsTable).where(eq(insuranceClaimsTable.id, params.data.claimId));

  if (!row) {
    res.status(404).json({ error: "Insurance claim not found" });
    return;
  }

  res.json(await enrichClaim(row));
});

router.put("/insurance/claims/:claimId", async (req, res): Promise<void> => {
  const params = UpdateInsuranceClaimParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateInsuranceClaimBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...body.data };
  if (body.data.status && ["approved", "rejected", "paid"].includes(body.data.status)) {
    updateData.resolvedAt = new Date();
  }

  const [updated] = await db
    .update(insuranceClaimsTable)
    .set(updateData)
    .where(eq(insuranceClaimsTable.id, params.data.claimId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Insurance claim not found" });
    return;
  }

  res.json(await enrichClaim(updated));
});

export default router;
