import { Router } from "express";
import { eq, and, or, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";
import { toUser } from "../db/database.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

const GUIDED_PROMPTS = [
  "What does family mean to you?",
  "How do you stay connected to your roots while living abroad?",
  "What traditions do you want to carry into your marriage?",
  "Describe your ideal Sunday morning.",
  "What role does faith play in your daily life?",
  "What does home mean to you?",
];

router.get("/", requireAuth, async (req, res) => {
  try {
    const [meRow] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .limit(1);

    if (!meRow) { res.status(401).json({ error: "Unauthorized" }); return; }
    const me = toUser(meRow);

    const [myLikes, myMessages, myBlocks, blockedByOthers] = await Promise.all([
      db.select().from(schema.likes).where(eq(schema.likes.fromId, me.id)),
      db.select().from(schema.messages).where(
        or(
          eq(schema.messages.fromId, me.id),
          eq(schema.messages.toId, me.id),
        )
      ),
      db.select({ blockedUserId: schema.blocks.blockedUserId }).from(schema.blocks).where(eq(schema.blocks.blockerUserId, me.id)),
      db.select({ blockerUserId: schema.blocks.blockerUserId }).from(schema.blocks).where(eq(schema.blocks.blockedUserId, me.id)),
    ]);

    const blockSet = new Set([
      ...myBlocks.map(b => b.blockedUserId),
      ...blockedByOthers.map(b => b.blockerUserId),
    ]);

    const mutualIds = new Set<string>();
    const matchedAtMap = new Map<string, Date>();

    for (const like of myLikes) {
      if (blockSet.has(like.toId)) continue;
      const reverseCheck = await db
        .select({ fromId: schema.likes.fromId })
        .from(schema.likes)
        .where(and(eq(schema.likes.fromId, like.toId), eq(schema.likes.toId, me.id)))
        .limit(1);

      if (reverseCheck.length > 0) {
        mutualIds.add(like.toId);
        matchedAtMap.set(like.toId, like.createdAt);
      }
    }

    // Build conversation map from mutual matches
    const convMap = new Map<string, {
      userId: string;
      lastMessage: string | null;
      lastMessageAt: Date | null;
      matchedAt: Date | null;
      unread: number;
    }>();

    for (const otherId of mutualIds) {
      convMap.set(otherId, {
        userId: otherId,
        lastMessage: null,
        lastMessageAt: null,
        matchedAt: matchedAtMap.get(otherId) ?? null,
        unread: 0,
      });
    }

    // Layer in messages
    for (const msg of myMessages) {
      const otherId = msg.fromId === me.id ? msg.toId : msg.fromId;
      const existing = convMap.get(otherId);
      if (!existing || !existing.lastMessageAt || msg.createdAt > existing.lastMessageAt) {
        convMap.set(otherId, {
          userId: otherId,
          lastMessage: msg.text,
          lastMessageAt: msg.createdAt,
          matchedAt: existing?.matchedAt ?? null,
          unread: existing?.unread ?? 0,
        });
      }
    }

    // Count unseen message notifications per sender
    const unreadResult = await db.execute(sql`
      SELECT from_user_id, COUNT(*) AS cnt
      FROM notifications
      WHERE user_id = ${me.id} AND type = 'message' AND seen = false
      GROUP BY from_user_id
    `);

    for (const row of unreadResult.rows as any[]) {
      const existing = convMap.get(row.from_user_id);
      if (existing) {
        existing.unread = Number(row.cnt);
      }
    }

    const userIds = Array.from(convMap.keys());
    const otherUsers = userIds.length > 0
      ? await db.select().from(schema.users).where(
          or(...userIds.map(id => eq(schema.users.id, id)))
        )
      : [];

    const userMap = new Map(otherUsers.map(u => [u.id, u]));

    const conversations = Array.from(convMap.values())
      .map(({ userId, lastMessage, lastMessageAt, matchedAt, unread }) => {
        const other = userMap.get(userId);
        return {
          userId,
          name: other?.name ?? "Unknown",
          photoUrl: other?.photoUrl ?? null,
          lastMessage,
          lastMessageAt: lastMessageAt ?? matchedAt,
          unread,
        };
      })
      .sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });

    res.json({ conversations });
  } catch (err) {
    req.log.error(err, "Messages list error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:userId", requireAuth, async (req, res) => {
  try {
    const [meRow] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .limit(1);

    if (!meRow) { res.status(401).json({ error: "Unauthorized" }); return; }
    const me = toUser(meRow);

    // Reading messages is allowed for all tiers — only sending is tier-gated.

    const otherId = req.params.userId;

    if (otherId === me.id) {
      res.status(400).json({ error: "Cannot open a conversation with yourself" });
      return;
    }

    const otherExists = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.id, otherId))
      .limit(1);

    if (otherExists.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Access check: the requesting user must be either mutually matched with the
    // other user OR already have a message thread with them.
    const [iLikedThem, theyLikedMe, existingMsg] = await Promise.all([
      db.select({ fromId: schema.likes.fromId })
        .from(schema.likes)
        .where(and(eq(schema.likes.fromId, me.id), eq(schema.likes.toId, otherId)))
        .limit(1),
      db.select({ fromId: schema.likes.fromId })
        .from(schema.likes)
        .where(and(eq(schema.likes.fromId, otherId), eq(schema.likes.toId, me.id)))
        .limit(1),
      db.select({ id: schema.messages.id })
        .from(schema.messages)
        .where(
          or(
            and(eq(schema.messages.fromId, me.id), eq(schema.messages.toId, otherId)),
            and(eq(schema.messages.fromId, otherId), eq(schema.messages.toId, me.id)),
          )
        )
        .limit(1),
    ]);

    const mutualMatch = iLikedThem.length > 0 && theyLikedMe.length > 0;
    const hasConversation = existingMsg.length > 0;

    if (!mutualMatch && !hasConversation) {
      res.status(403).json({ error: "You are not matched with this user" });
      return;
    }

    const thread = await db
      .select()
      .from(schema.messages)
      .where(
        or(
          and(eq(schema.messages.fromId, me.id), eq(schema.messages.toId, otherId)),
          and(eq(schema.messages.fromId, otherId), eq(schema.messages.toId, me.id)),
        )
      );

    thread.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Mark unseen message + match notifications from this person as seen
    await db
      .update(schema.notifications)
      .set({ seen: true })
      .where(
        and(
          eq(schema.notifications.userId, me.id),
          eq(schema.notifications.fromUserId, otherId),
          or(
            eq(schema.notifications.type, "message"),
            eq(schema.notifications.type, "match")
          )
        )
      );

    const shuffled = [...GUIDED_PROMPTS].sort(() => Math.random() - 0.5).slice(0, 3);
    res.json({ messages: thread, guidedPrompts: shuffled, canSend: me.tier !== "free" });
  } catch (err) {
    req.log.error(err, "Get thread error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:userId", requireAuth, async (req, res) => {
  try {
    const [meRow] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .limit(1);

    if (!meRow) { res.status(401).json({ error: "Unauthorized" }); return; }
    const me = toUser(meRow);

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
    const otherExists = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.id, otherId))
      .limit(1);

    if (otherExists.length === 0) {
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

    await db.insert(schema.messages).values(message);

    // Notify the receiver of the new message
    await db.insert(schema.notifications).values({
      id: uuidv4(),
      userId: otherId,
      type: "message",
      fromUserId: me.id,
      seen: false,
    });

    res.status(201).json(message);
  } catch (err) {
    req.log.error(err, "Send message error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
