import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import {
  ListNotificationsQueryParams,
  CreateNotificationBody,
  MarkNotificationReadParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const query = ListNotificationsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [];
  if (query.data.workerId != null) conditions.push(eq(notificationsTable.workerId, query.data.workerId));
  if (query.data.read != null) conditions.push(eq(notificationsTable.read, query.data.read));

  let rows;
  if (conditions.length > 0) {
    const { and } = await import("drizzle-orm");
    rows = await db.select().from(notificationsTable).where(and(...conditions));
  } else {
    rows = await db.select().from(notificationsTable);
  }

  res.json(rows);
});

router.post("/notifications", async (req, res): Promise<void> => {
  const parsed = CreateNotificationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db.insert(notificationsTable).values(parsed.data).returning();
  res.status(201).json(created);
});

router.put("/notifications/:notificationId/read", async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [updated] = await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.id, params.data.notificationId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(updated);
});

export default router;
