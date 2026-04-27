import { v4 as uuidv4 } from "uuid";
import { sql } from "drizzle-orm";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";
import { getAppFlags } from "../routes/settings.js";

export interface DailyCounts {
  messagesSent: number;
  likesSent: number;
}

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function nextMidnightUtcMs(): number {
  const d = new Date();
  d.setUTCHours(24, 0, 0, 0);
  return d.getTime();
}

async function getRow(userId: string, date: string): Promise<DailyCounts> {
  const rows = await db.execute<{ messages_sent: number; likes_sent: number }>(sql`
    SELECT messages_sent, likes_sent
    FROM user_daily_limits
    WHERE user_id = ${userId} AND date = ${date}::date
    LIMIT 1
  `);
  const r = rows.rows[0];
  return { messagesSent: r?.messages_sent ?? 0, likesSent: r?.likes_sent ?? 0 };
}

export async function getTodayCounts(userId: string): Promise<DailyCounts> {
  return getRow(userId, todayUtc());
}

export type IncrementResult =
  | { ok: true;  count: number }
  | { ok: false; count: number };

/**
 * Atomically increment a daily counter only if it is still strictly below `limit`.
 * Implementation:
 *   1. INSERT zero-row ON CONFLICT DO NOTHING (ensures row exists)
 *   2. UPDATE ... SET col = col + 1 WHERE col < limit RETURNING col
 *      Postgres row-level locking serializes concurrent UPDATE attempts, so two
 *      simultaneous requests cannot both pass the check and exceed the limit.
 */
async function tryIncrement(
  userId: string,
  column: "messages_sent" | "likes_sent",
  limit: number,
): Promise<IncrementResult> {
  if (limit <= 0) {
    const cur = await getRow(userId, todayUtc());
    return { ok: false, count: column === "messages_sent" ? cur.messagesSent : cur.likesSent };
  }
  const date = todayUtc();
  const id = uuidv4();
  await db.execute(sql`
    INSERT INTO user_daily_limits (id, user_id, date, messages_sent, likes_sent)
    VALUES (${id}, ${userId}, ${date}::date, 0, 0)
    ON CONFLICT (user_id, date) DO NOTHING
  `);
  if (column === "messages_sent") {
    const r = await db.execute<{ messages_sent: number }>(sql`
      UPDATE user_daily_limits
      SET messages_sent = messages_sent + 1
      WHERE user_id = ${userId} AND date = ${date}::date AND messages_sent < ${limit}
      RETURNING messages_sent
    `);
    if (r.rows.length === 0) {
      const cur = await getRow(userId, date);
      return { ok: false, count: cur.messagesSent };
    }
    return { ok: true, count: r.rows[0]!.messages_sent };
  } else {
    const r = await db.execute<{ likes_sent: number }>(sql`
      UPDATE user_daily_limits
      SET likes_sent = likes_sent + 1
      WHERE user_id = ${userId} AND date = ${date}::date AND likes_sent < ${limit}
      RETURNING likes_sent
    `);
    if (r.rows.length === 0) {
      const cur = await getRow(userId, date);
      return { ok: false, count: cur.likesSent };
    }
    return { ok: true, count: r.rows[0]!.likes_sent };
  }
}

export async function tryIncrementMessages(userId: string, limit: number): Promise<IncrementResult> {
  return tryIncrement(userId, "messages_sent", limit);
}

export async function tryIncrementLikes(userId: string, limit: number): Promise<IncrementResult> {
  return tryIncrement(userId, "likes_sent", limit);
}

/** Roll back a successful increment when the action that followed it failed. */
export async function decrementMessages(userId: string): Promise<void> {
  const date = todayUtc();
  await db.execute(sql`
    UPDATE user_daily_limits
    SET messages_sent = GREATEST(messages_sent - 1, 0)
    WHERE user_id = ${userId} AND date = ${date}::date
  `);
}

export async function decrementLikes(userId: string): Promise<void> {
  const date = todayUtc();
  await db.execute(sql`
    UPDATE user_daily_limits
    SET likes_sent = GREATEST(likes_sent - 1, 0)
    WHERE user_id = ${userId} AND date = ${date}::date
  `);
}

export interface DailyLimitsSnapshot {
  messagesLimit: number;
  messagesUsed: number;
  messagesRemaining: number;
  likesLimit: number;
  likesUsed: number;
  likesRemaining: number;
  resetsAt: number;
}

export async function getDailyLimitsSnapshot(userId: string): Promise<DailyLimitsSnapshot> {
  const [counts, flags] = await Promise.all([getTodayCounts(userId), getAppFlags()]);
  const messagesLimit = flags.freeDailyMessageLimit;
  const likesLimit = flags.freeDailyLikeLimit;
  return {
    messagesLimit,
    messagesUsed: counts.messagesSent,
    messagesRemaining: Math.max(0, messagesLimit - counts.messagesSent),
    likesLimit,
    likesUsed: counts.likesSent,
    likesRemaining: Math.max(0, likesLimit - counts.likesSent),
    resetsAt: nextMidnightUtcMs(),
  };
}

schema; // keep import used (drizzle table inference)
