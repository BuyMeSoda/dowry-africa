import { Router } from "express";
import { users, likes, passes, publicUser, getLikesKey } from "../db/database.js";
import { requireAuth } from "../middlewares/auth.js";
import { scoreMatch, passesHardFilters, rankFeed } from "../lib/matching.js";

const router = Router();

const TIER_LIMITS: Record<string, number> = { free: 5, core: 50, badge: 50 };

router.get("/feed", requireAuth, (req, res) => {
  const me = users.get(req.userId!);
  if (!me) { res.status(401).json({ error: "Unauthorized" }); return; }

  const limit = TIER_LIMITS[me.tier] ?? 5;

  const scoredCandidates = [];
  for (const candidate of users.values()) {
    if (!passesHardFilters(me, candidate)) continue;
    const alreadyPassed = passes.has(getLikesKey(me.id, candidate.id));
    if (alreadyPassed) continue;
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
});

router.get("/liked-me", requireAuth, (req, res) => {
  const me = users.get(req.userId!);
  if (!me) { res.status(401).json({ error: "Unauthorized" }); return; }

  const blurFree = me.tier === "free";
  const likedBy = [];

  for (const like of likes.values()) {
    if (like.toId === me.id) {
      const liker = users.get(like.fromId);
      if (!liker) continue;
      likedBy.push({
        user: publicUser(liker),
        blurred: blurFree,
      });
    }
  }

  res.json({ likedBy, count: likedBy.length });
});

router.get("/:id/score", requireAuth, (req, res) => {
  const me = users.get(req.userId!);
  const candidate = users.get(req.params.id);
  if (!me || !candidate) { res.status(404).json({ error: "Not found" }); return; }
  const result = scoreMatch(me, candidate);
  res.json(result);
});

router.post("/like/:id", requireAuth, (req, res) => {
  const me = users.get(req.userId!);
  const target = users.get(req.params.id);
  if (!me || !target) { res.status(404).json({ error: "Not found" }); return; }
  if (me.id === target.id) { res.status(400).json({ error: "Cannot like yourself" }); return; }

  const key = getLikesKey(me.id, target.id);
  likes.set(key, { fromId: me.id, toId: target.id, createdAt: new Date() });

  const reverseKey = getLikesKey(target.id, me.id);
  const mutual = likes.has(reverseKey);

  res.json({ ok: true, mutual });
});

router.post("/pass/:id", requireAuth, (req, res) => {
  const me = users.get(req.userId!);
  if (!me) { res.status(401).json({ error: "Unauthorized" }); return; }

  const key = getLikesKey(me.id, req.params.id);
  passes.set(key, { fromId: me.id, toId: req.params.id });
  res.json({ ok: true });
});

export default router;
