import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
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

    const [allUserRows, myPasses, myLikes] = await Promise.all([
      db.select().from(schema.users),
      db.select({ toId: schema.passes.toId }).from(schema.passes).where(eq(schema.passes.fromId, me.id)),
      db.select({ toId: schema.likes.toId }).from(schema.likes).where(eq(schema.likes.fromId, me.id)),
    ]);

    const passedIds = new Set(myPasses.map(p => p.toId));
    const likedIds = new Set(myLikes.map(l => l.toId));

    const scoredCandidates = [];
    for (const row of allUserRows) {
      const candidate = toUser(row);
      if (!passesHardFilters(me, candidate)) continue;
      if (passedIds.has(candidate.id)) continue;
      if (likedIds.has(candidate.id)) continue; // hide already-liked profiles
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

    // Exclude people we've already mutually matched with
    const myLikedIds = new Set(
      (await db.select({ toId: schema.likes.toId }).from(schema.likes).where(eq(schema.likes.fromId, me.id)))
        .map(l => l.toId)
    );

    const likedBy = [];
    for (const { fromId } of likerRows) {
      if (myLikedIds.has(fromId)) continue; // already mutual — skip from "likes you" list
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

    if (mutual) {
      // Remove any pending 'like' notification — replace with 'match' for both
      await db.execute(
        (await import("drizzle-orm")).sql`
          DELETE FROM notifications
          WHERE (user_id = ${meRow.id}   AND from_user_id = ${targetRow.id} AND type = 'like')
             OR (user_id = ${targetRow.id} AND from_user_id = ${meRow.id}   AND type = 'like')
        `
      );
      await db.insert(schema.notifications).values([
        { id: uuidv4(), userId: meRow.id,    type: "match", fromUserId: targetRow.id },
        { id: uuidv4(), userId: targetRow.id, type: "match", fromUserId: meRow.id   },
      ]);
    } else {
      // Notify target that someone liked them (upsert — one unseen like notif per person pair)
      await db.execute(
        (await import("drizzle-orm")).sql`
          INSERT INTO notifications (id, user_id, type, from_user_id, seen)
          VALUES (${uuidv4()}, ${targetRow.id}, 'like', ${meRow.id}, false)
          ON CONFLICT DO NOTHING
        `
      );
    }

    res.json({ ok: true, mutual, matchedUser: mutual ? publicUser(toUser(targetRow)) : null });
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
