import { Router } from "express";
import { eq, or } from "drizzle-orm";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";

const router = Router();

// POST /api/unsubscribe
router.post("/", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const normalised = email.toLowerCase().trim();
    const now = new Date();

    await Promise.allSettled([
      db.update(schema.users)
        .set({ unsubscribedAt: now })
        .where(eq(schema.users.email, normalised)),
      db.update(schema.earlyAccess)
        .set({ unsubscribedAt: now })
        .where(eq(schema.earlyAccess.email, normalised)),
    ]);

    res.json({ success: true });
  } catch (err) {
    req.log.error(err, "Unsubscribe error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
