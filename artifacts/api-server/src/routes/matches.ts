import { Router } from "express";
import { eq, and, or } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";
import { toUser, publicUser } from "../db/database.js";
import { requireAuth } from "../middlewares/auth.js";
import { scoreMatch, passesHardFilters, rankFeed } from "../lib/matching.js";

const router = Router();

// Max total profiles a tier can see in one session
const TIER_CAPS: Record<string, number> = { free: 5, core: 200, badge: 200 };
const PAGE_SIZE_DEFAULT = 10;

async function getBlockSet(userId: string): Promise<Set<string>> {
  const [myBlocks, blockedByOthers] = await Promise.all([
    db.select({ blockedUserId: schema.blocks.blockedUserId }).from(schema.blocks).where(eq(schema.blocks.blockerUserId, userId)),
    db.select({ blockerUserId: schema.blocks.blockerUserId }).from(schema.blocks).where(eq(schema.blocks.blockedUserId, userId)),
  ]);
  return new Set([
    ...myBlocks.map(b => b.blockedUserId),
    ...blockedByOthers.map(b => b.blockerUserId),
  ]);
}

router.get("/feed", requireAuth, async (req, res) => {
  try {
    const [meRow] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .limit(1);

    if (!meRow) { res.status(401).json({ error: "Unauthorized" }); return; }
    const me = toUser(meRow);

    const offset   = Math.max(0, parseInt(req.query.offset as string ?? "0") || 0);
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.limit  as string ?? String(PAGE_SIZE_DEFAULT)) || PAGE_SIZE_DEFAULT));

    const originFilter: string[] = req.query.origin
      ? (req.query.origin as string).split(",").map(s => s.trim()).filter(Boolean)
      : [];
    const residenceFilter: string[] = req.query.residence
      ? (req.query.residence as string).split(",").map(s => s.trim()).filter(Boolean)
      : [];
    const faithFilter: string[] = req.query.faith
      ? (req.query.faith as string).split(",").map(s => s.trim()).filter(Boolean)
      : [];

    const tierCap = TIER_CAPS[me.tier] ?? 5;

    const [allUserRows, myPasses, myLikes, likedMeRows, myMessageRows, blockSet] = await Promise.all([
      db.select().from(schema.users),
      // Users I've passed on
      db.select({ toId: schema.passes.toId }).from(schema.passes).where(eq(schema.passes.fromId, me.id)),
      // Users I've already liked (outgoing)
      db.select({ toId: schema.likes.toId }).from(schema.likes).where(eq(schema.likes.fromId, me.id)),
      // Users who have already liked me (incoming) — they belong in "Liked You", not feed
      db.select({ fromId: schema.likes.fromId }).from(schema.likes).where(eq(schema.likes.toId, me.id)),
      // Users I've already exchanged messages with — already in a conversation
      db.select({ fromId: schema.messages.fromId, toId: schema.messages.toId })
        .from(schema.messages)
        .where(or(eq(schema.messages.fromId, me.id), eq(schema.messages.toId, me.id))),
      getBlockSet(me.id),
    ]);

    const passedIds        = new Set(myPasses.map(p => p.toId));
    const likedIds         = new Set(myLikes.map(l => l.toId));
    const likedMeIds       = new Set(likedMeRows.map(l => l.fromId));
    const conversationIds  = new Set<string>();
    for (const m of myMessageRows) {
      if (m.fromId !== me.id) conversationIds.add(m.fromId);
      if (m.toId   !== me.id) conversationIds.add(m.toId);
    }

    req.log.info({
      userId: me.id,
      excludedLikedByMe:    likedIds.size,
      excludedLikedMe:      likedMeIds.size,
      excludedPassed:       passedIds.size,
      excludedConversation: conversationIds.size,
      excludedBlocked:      blockSet.size,
    }, "Feed exclusion counts");

    const scoredCandidates = [];
    for (const row of allUserRows) {
      const candidate = toUser(row);
      if (!passesHardFilters(me, candidate)) continue; // excludes self + blocks + gender/age filters
      if (likedIds.has(candidate.id))        continue; // already liked them
      if (likedMeIds.has(candidate.id))      continue; // they liked me — show in "Liked You" tab instead
      if (passedIds.has(candidate.id))       continue; // already passed on them
      if (conversationIds.has(candidate.id)) continue; // already in a conversation
      if (blockSet.has(candidate.id))        continue; // blocked (belt-and-suspenders)

      if (originFilter.length > 0) {
        const heritage: string[] = candidate.heritage ?? [];
        const matches = originFilter.some(f =>
          heritage.some(h => h.toLowerCase() === f.toLowerCase())
        );
        if (!matches) continue;
      }

      if (residenceFilter.length > 0) {
        const residence = candidate.country ?? "";
        const matches = residenceFilter.some(f =>
          residence.toLowerCase() === f.toLowerCase()
        );
        if (!matches) continue;
      }

      if (faithFilter.length > 0) {
        const faith = candidate.faith ?? "";
        const matches = faithFilter.some(f =>
          faith.toLowerCase().includes(f.toLowerCase()) || f.toLowerCase().includes(faith.toLowerCase())
        );
        if (!matches) continue;
      }

      const { score, dimensions, prompts } = scoreMatch(me, candidate);
      const freshBoost = (Date.now() - candidate.lastActive.getTime()) < 48 * 60 * 60 * 1000;
      scoredCandidates.push({ user: candidate, score, dimensions, prompts, freshBoost });
    }

    const ranked = rankFeed(me, scoredCandidates);
    const cappedRanked = ranked.slice(0, tierCap);
    const totalAvailable = cappedRanked.length;
    const page = cappedRanked.slice(offset, offset + pageSize);
    const feed = page.map(({ user, score, dimensions, prompts, freshBoost }) => ({
      user: publicUser(user),
      score,
      dimensions,
      prompts,
      freshBoost,
    }));

    const reachedTierLimit = me.tier === "free" && (offset + feed.length) >= tierCap;
    const hasMore = (offset + feed.length) < totalAvailable;

    res.json({ feed, total: totalAvailable, hasMore, reachedTierLimit, tier: me.tier });
  } catch (err) {
    req.log.error(err, "Feed error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Sent likes — users the current user liked but who haven't liked back yet (pending)
router.get("/sent", requireAuth, async (req, res) => {
  try {
    const myId = req.userId!;
    const blockSet = await getBlockSet(myId);

    const myLikes = await db
      .select()
      .from(schema.likes)
      .where(eq(schema.likes.fromId, myId));

    const sent = [];
    for (const like of myLikes) {
      if (blockSet.has(like.toId)) continue;

      // Skip if they liked back (already a mutual match)
      const reverse = await db
        .select({ fromId: schema.likes.fromId })
        .from(schema.likes)
        .where(and(eq(schema.likes.fromId, like.toId), eq(schema.likes.toId, myId)))
        .limit(1);
      if (reverse.length > 0) continue;

      const [userRow] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, like.toId))
        .limit(1);
      if (!userRow) continue;

      sent.push({ user: publicUser(toUser(userRow)), likedAt: like.createdAt });
    }

    res.json({ sent, count: sent.length });
  } catch (err) {
    req.log.error(err, "Sent likes error");
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

    const [likerRows, myLikedRows, blockSet] = await Promise.all([
      db.select({ fromId: schema.likes.fromId }).from(schema.likes).where(eq(schema.likes.toId, me.id)),
      db.select({ toId: schema.likes.toId }).from(schema.likes).where(eq(schema.likes.fromId, me.id)),
      getBlockSet(me.id),
    ]);

    const myLikedIds = new Set(myLikedRows.map(l => l.toId));

    const likedBy = [];
    for (const { fromId } of likerRows) {
      if (myLikedIds.has(fromId)) continue;
      if (blockSet.has(fromId)) continue;
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

// Check whether the current user has liked or is matched with a specific user
router.get("/status/:userId", requireAuth, async (req, res) => {
  try {
    const myId = req.userId!;
    const theirId = req.params.userId;

    const [iLikedThem, theyLikedMe] = await Promise.all([
      db.select().from(schema.likes).where(and(eq(schema.likes.fromId, myId), eq(schema.likes.toId, theirId))).limit(1),
      db.select().from(schema.likes).where(and(eq(schema.likes.fromId, theirId), eq(schema.likes.toId, myId))).limit(1),
    ]);

    const liked = iLikedThem.length > 0;
    const matched = liked && theyLikedMe.length > 0;

    res.json({ liked, matched });
  } catch (err) {
    req.log.error(err, "Match status error");
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
      await db.execute(
        sql`
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
      await db.execute(
        sql`
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

// Unlike — remove a like that has not yet become a mutual match
router.delete("/like/:userId", requireAuth, async (req, res) => {
  try {
    const myId = req.userId!;
    const theirId = req.params.userId;

    await db.delete(schema.likes)
      .where(and(eq(schema.likes.fromId, myId), eq(schema.likes.toId, theirId)));

    // Remove any pending like notification
    await db.execute(
      sql`DELETE FROM notifications WHERE user_id = ${theirId} AND from_user_id = ${myId} AND type = 'like'`
    );

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "Unlike error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Unmatch — remove mutual likes and all messages between the two users
router.post("/unmatch/:userId", requireAuth, async (req, res) => {
  try {
    const myId = req.userId!;
    const theirId = req.params.userId;

    await db.execute(
      sql`
        DELETE FROM likes
        WHERE (from_id = ${myId} AND to_id = ${theirId})
           OR (from_id = ${theirId} AND to_id = ${myId})
      `
    );

    await db.execute(
      sql`
        DELETE FROM messages
        WHERE (from_id = ${myId} AND to_id = ${theirId})
           OR (from_id = ${theirId} AND to_id = ${myId})
      `
    );

    await db.execute(
      sql`
        DELETE FROM notifications
        WHERE ((user_id = ${myId}    AND from_user_id = ${theirId}) OR
               (user_id = ${theirId} AND from_user_id = ${myId}))
          AND type IN ('like', 'match', 'message')
      `
    );

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "Unmatch error");
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
