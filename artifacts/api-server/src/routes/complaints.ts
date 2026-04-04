import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, complaintsTable, workersTable } from "@workspace/db";
import {
  ListComplaintsQueryParams,
  CreateComplaintBody,
  GetComplaintParams,
  UpdateComplaintParams,
  UpdateComplaintBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichComplaint(complaint: typeof complaintsTable.$inferSelect) {
  const worker = await db.select({ name: workersTable.name }).from(workersTable).where(eq(workersTable.id, complaint.workerId));
  return { ...complaint, workerName: worker[0]?.name ?? null };
}

router.get("/complaints", async (req, res): Promise<void> => {
  const query = ListComplaintsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.status) conditions.push(eq(complaintsTable.status, query.data.status));
  if (query.data.workerId) conditions.push(eq(complaintsTable.workerId, query.data.workerId));
  if (query.data.type) conditions.push(eq(complaintsTable.type, query.data.type));

  let rows;
  if (conditions.length > 0) {
    const { and } = await import("drizzle-orm");
    rows = await db.select().from(complaintsTable).where(and(...conditions));
  } else {
    rows = await db.select().from(complaintsTable);
  }

  const enriched = await Promise.all(rows.map(enrichComplaint));
  res.json(enriched);
});

router.post("/complaints", async (req, res): Promise<void> => {
  const parsed = CreateComplaintBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db.insert(complaintsTable).values(parsed.data).returning();
  res.status(201).json(await enrichComplaint(created));
});

router.get("/complaints/:complaintId", async (req, res): Promise<void> => {
  const params = GetComplaintParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, params.data.complaintId));

  if (!row) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }

  res.json(await enrichComplaint(row));
});

router.put("/complaints/:complaintId", async (req, res): Promise<void> => {
  const params = UpdateComplaintParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateComplaintBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...body.data };
  if (body.data.status && ["resolved", "dismissed"].includes(body.data.status)) {
    updateData.resolvedAt = new Date();
  }

  const [updated] = await db
    .update(complaintsTable)
    .set(updateData)
    .where(eq(complaintsTable.id, params.data.complaintId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Complaint not found" });
    return;
  }

  res.json(await enrichComplaint(updated));
});

export default router;
