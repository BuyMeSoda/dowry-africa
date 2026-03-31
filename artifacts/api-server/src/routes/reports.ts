import { Router } from "express";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

const VALID_REASONS = [
  "fake_profile",
  "harassment",
  "inappropriate_content",
  "scam",
  "spam",
  "underage",
  "other",
];

router.post("/", requireAuth, async (req, res) => {
  try {
    const reporterId = req.userId!;
    const { reportedUserId, reason, details } = req.body;

    if (!reportedUserId || !reason) {
      res.status(400).json({ error: "reportedUserId and reason are required" });
      return;
    }

    if (!VALID_REASONS.includes(reason)) {
      res.status(400).json({ error: "Invalid reason" });
      return;
    }

    if (reporterId === reportedUserId) {
      res.status(400).json({ error: "Cannot report yourself" });
      return;
    }

    const [targetRow] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.id, reportedUserId))
      .limit(1);

    if (!targetRow) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await db.insert(schema.reports).values({
      id: uuidv4(),
      reporterUserId: reporterId,
      reportedUserId,
      reason,
      details: details ?? null,
      status: "pending",
    });

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "Submit report error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
