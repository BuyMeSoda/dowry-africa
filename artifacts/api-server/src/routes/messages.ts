import { Router } from "express";
import { users, messages, likes, getLikesKey, publicUser } from "../db/database.js";
import { requireAuth } from "../middlewares/auth.js";
import { v4 as uuidv4 } from "uuid";

const router = Router();

const GUIDED_PROMPTS = [
  "What does family mean to you?",
  "How do you stay connected to your roots while living abroad?",
  "What traditions do you want to carry into your marriage?",
  "Describe your ideal Sunday morning.",
  "What role does faith play in your daily life?",
  "What does home mean to you?",
];

router.get("/", requireAuth, (req, res) => {
  const me = users.get(req.userId!);
  if (!me) { res.status(401).json({ error: "Unauthorized" }); return; }

  const convMap = new Map<string, { userId: string; lastMessage: string | null; lastMessageAt: Date | null; unread: number; matchedAt: Date | null }>();

  // Seed from mutual likes first (so mutual matches always appear)
  for (const like of likes.values()) {
    if (like.fromId !== me.id) continue;
    const reverseKey = getLikesKey(like.toId, me.id);
    if (!likes.has(reverseKey)) continue;
    // mutual match
    const other = users.get(like.toId);
    if (!other) continue;
    if (!convMap.has(like.toId)) {
      convMap.set(like.toId, { userId: like.toId, lastMessage: null, lastMessageAt: null, unread: 0, matchedAt: like.createdAt });
    }
  }

  // Overlay actual messages on top
  for (const msg of messages) {
    if (msg.fromId !== me.id && msg.toId !== me.id) continue;
    const otherId = msg.fromId === me.id ? msg.toId : msg.fromId;
    const existing = convMap.get(otherId);
    if (!existing || !existing.lastMessageAt || msg.createdAt > existing.lastMessageAt) {
      convMap.set(otherId, { userId: otherId, lastMessage: msg.text, lastMessageAt: msg.createdAt, unread: 0, matchedAt: existing?.matchedAt ?? null });
    }
  }

  const conversations = Array.from(convMap.values()).map(({ userId, lastMessage, lastMessageAt, unread, matchedAt }) => {
    const other = users.get(userId);
    return {
      userId,
      name: other?.name ?? "Unknown",
      photoUrl: other?.photoUrl,
      lastMessage,
      lastMessageAt: lastMessageAt ?? matchedAt,
      unread,
    };
  }).sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });

  res.json({ conversations });
});

router.get("/:userId", requireAuth, (req, res) => {
  const me = users.get(req.userId!);
  if (!me) { res.status(401).json({ error: "Unauthorized" }); return; }

  if (me.tier === "free") {
    res.status(403).json({ error: "Messaging requires a Core or Badge subscription" });
    return;
  }

  const otherId = req.params.userId;
  const thread = messages.filter(m =>
    (m.fromId === me.id && m.toId === otherId) ||
    (m.fromId === otherId && m.toId === me.id)
  ).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const shuffled = [...GUIDED_PROMPTS].sort(() => Math.random() - 0.5).slice(0, 3);
  res.json({ messages: thread, guidedPrompts: shuffled });
});

router.post("/:userId", requireAuth, (req, res) => {
  const me = users.get(req.userId!);
  if (!me) { res.status(401).json({ error: "Unauthorized" }); return; }

  if (me.tier === "free") {
    res.status(403).json({ error: "Messaging requires a Core or Badge subscription" });
    return;
  }

  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400).json({ error: "Message text required" });
    return;
  }

  const otherId = req.params.userId;
  if (!users.has(otherId)) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const message = {
    id: uuidv4(),
    fromId: me.id,
    toId: otherId,
    text: text.trim(),
    createdAt: new Date(),
  };
  messages.push(message);

  res.status(201).json(message);
});

export default router;
