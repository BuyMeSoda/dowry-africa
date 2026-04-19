import { Router } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";
import { requireAuth, requireApproved } from "../middlewares/auth.js";

const router = Router();

// GET /api/notifications/count
router.get("/count", requireAuth, requireApproved, async (req, res) => {
  try {
    const userId = req.userId!;

    const result = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE type = 'like'    AND seen = false) AS likes,
        COUNT(*) FILTER (WHERE type = 'match'   AND seen = false) AS matches,
        COUNT(*) FILTER (WHERE type = 'message' AND seen = false) AS messages,
        COUNT(*) FILTER (WHERE seen = false) AS total
      FROM notifications
      WHERE user_id = ${userId}
    `);

    const row = result.rows[0] as any;
    res.json({
      likes:    Number(row?.likes    ?? 0),
      matches:  Number(row?.matches  ?? 0),
      messages: Number(row?.messages ?? 0),
      total:    Number(row?.total    ?? 0),
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/notifications/seen — mark all (or by type) as seen
router.post("/seen", requireAuth, requireApproved, async (req, res) => {
  try {
    const userId = req.userId!;
    const { type } = req.body as { type?: string };

    if (type) {
      await db
        .update(schema.notifications)
        .set({ seen: true })
        .where(and(eq(schema.notifications.userId, userId), eq(schema.notifications.type, type)));
    } else {
      await db
        .update(schema.notifications)
        .set({ seen: true })
        .where(eq(schema.notifications.userId, userId));
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
