import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";
import { toUser, publicUser } from "../db/database.js";
import { requireAuth } from "../middlewares/auth.js";
import { scoreMatch, passesHardFilters, rankFeed } from "../lib/matching.js";

const router = Router();

const TIER_LIMITS: Record<string, number> = { free: 5, core: 50, badge: 50 };

router.get("/feed", requireAuth, async (req, res) => {
  try {
    const [meRow] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .limit(1);

    if (!meRow) { res.status(401).json({ error: "Unauthorized" }); return; }
    const me = toUser(meRow);

    const limit = TIER_LIMITS[me.tier] ?? 5;

    const [allUserRows, myPasses] = await Promise.all([
      db.select().from(schema.users),
      db.select({ toId: schema.passes.toId }).from(schema.passes).where(eq(schema.passes.fromId, me.id)),
    ]);

    const passedIds = new Set(myPasses.map(p => p.toId));

    const scoredCandidates = [];
    for (const row of allUserRows) {
      const candidate = toUser(row);
      if (!passesHardFilters(me, candidate)) continue;
      if (passedIds.has(candidate.id)) continue;
      const { score, dimensions, prompts } = scoreMatch(me, candidate);
      const now = Date.now();
      const freshBoost = (now - candidate.lastActive.getTime()) < 48 * 60 * 60 * 1000;
      scoredCandidates.push({ user: candidate, score, dimensions, prompts, freshBoost });
    }

    const ranked = rankFeed(me, scoredCandidates);
    const feed = ranked.slice(0, limit).map(({ user, score, dimensions, prompts, freshBoost }) => ({
      user: publicUser(user),
      score,
      dimensions,
      prompts,
      freshBoost,
    }));

    res.json({ feed, total: feed.length, tier: me.tier });
  } catch (err) {
    req.log.error(err, "Feed error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/liked-me", requireAuth, async (req, res) => {
  try {
    const [meRow] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .limit(1);

    if (!meRow) { res.status(401).json({ error: "Unauthorized" }); return; }
    const me = toUser(meRow);

    const blurFree = me.tier === "free";

    const likerRows = await db
      .select({ fromId: schema.likes.fromId })
      .from(schema.likes)
      .where(eq(schema.likes.toId, me.id));

    const likedBy = [];
    for (const { fromId } of likerRows) {
      const [likerRow] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, fromId))
        .limit(1);

      if (!likerRow) continue;
      likedBy.push({ user: publicUser(toUser(likerRow)), blurred: blurFree });
    }

    res.json({ likedBy, count: likedBy.length });
  } catch (err) {
    req.log.error(err, "Liked-me error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/score", requireAuth, async (req, res) => {
  try {
    const [[meRow], [candidateRow]] = await Promise.all([
      db.select().from(schema.users).where(eq(schema.users.id, req.userId!)).limit(1),
      db.select().from(schema.users).where(eq(schema.users.id, req.params.id)).limit(1),
    ]);

    if (!meRow || !candidateRow) { res.status(404).json({ error: "Not found" }); return; }
    const result = scoreMatch(toUser(meRow), toUser(candidateRow));
    res.json(result);
  } catch (err) {
    req.log.error(err, "Score error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/like/:id", requireAuth, async (req, res) => {
  try {
    const [[meRow], [targetRow]] = await Promise.all([
      db.select().from(schema.users).where(eq(schema.users.id, req.userId!)).limit(1),
      db.select().from(schema.users).where(eq(schema.users.id, req.params.id)).limit(1),
    ]);

    if (!meRow || !targetRow) { res.status(404).json({ error: "Not found" }); return; }
    if (meRow.id === targetRow.id) { res.status(400).json({ error: "Cannot like yourself" }); return; }

    await db.insert(schema.likes)
      .values({ fromId: meRow.id, toId: targetRow.id })
      .onConflictDoNothing();

    const reverseCheck = await db
      .select({ fromId: schema.likes.fromId })
      .from(schema.likes)
      .where(and(eq(schema.likes.fromId, targetRow.id), eq(schema.likes.toId, meRow.id)))
      .limit(1);

    const mutual = reverseCheck.length > 0;
    res.json({ ok: true, mutual });
  } catch (err) {
    req.log.error(err, "Like error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/pass/:id", requireAuth, async (req, res) => {
  try {
    await db.insert(schema.passes)
      .values({ fromId: req.userId!, toId: req.params.id })
      .onConflictDoNothing();

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "Pass error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
