import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";
import { toUser, sanitizeUser, publicUser, calcCompleteness } from "../db/database.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

const ALLOWED_FIELDS = [
  "city", "country", "heritage", "faith", "languages",
  "intent", "lifeStage", "childrenPref", "marriageTimeline",
  "familyInvolvement", "relocationOpen", "bio", "quote", "photoUrl",
  "genderPref", "minAge", "maxAge",
  "preferredFaith", "preferredCountry", "preferredHeritage",
] as const;

router.get("/me/profile", requireAuth, async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .limit(1);

    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(sanitizeUser(toUser(row)));
  } catch (err) {
    req.log.error(err, "Get profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/me/profile", requireAuth, async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .limit(1);

    if (!row) { res.status(404).json({ error: "Not found" }); return; }

    const updates: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in req.body) {
        updates[key] = req.body[key];
      }
    }

    const merged = { ...toUser(row), ...updates };
    updates["completeness"] = calcCompleteness(merged);
    updates["lastActive"] = new Date();

    await db
      .update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, req.userId!));

    const [updated] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .limit(1);

    res.json(sanitizeUser(toUser(updated)));
  } catch (err) {
    req.log.error(err, "Update profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.params.id))
      .limit(1);

    if (!row) { res.status(404).json({ error: "User not found" }); return; }
    res.json(publicUser(toUser(row)));
  } catch (err) {
    req.log.error(err, "Get user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
