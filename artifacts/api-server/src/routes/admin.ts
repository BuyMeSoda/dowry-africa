import { Router } from "express";
import { eq, sql, and, or, asc, desc, gte, lt, ilike, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";
import { requireAdmin } from "../middlewares/adminAuth.js";
import { getPricing } from "./settings.js";
import { logger } from "../lib/logger.js";
import { sendBroadcastEmail, sendAdminDirectEmail, buildBroadcastHtml } from "../lib/email.js";

const router = Router();
router.use(requireAdmin);

// ── Dashboard ──────────────────────────────────────────────────────────────
router.get("/dashboard", async (_req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      [totalUsers],
      [totalEarlyAccess],
      [newToday],
      [newThisWeek],
      [coreSubs],
      [badgeSubs],
      [totalMessages],
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(schema.users),
      db.execute(sql`SELECT count(*)::int AS count FROM early_access`).then(r => [{ count: Number((r.rows[0] as any)?.count ?? 0) }]),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.users).where(gte(schema.users.createdAt, todayStart)),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.users).where(gte(schema.users.createdAt, weekStart)),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.users).where(eq(schema.users.tier, "core")),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.users).where(and(eq(schema.users.tier, "badge"), eq(schema.users.hasBadge, true))),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.messages),
    ]);

    // db.execute returns { rows } not an array — handle separately
    const matchesResult = await db.execute(
      sql`SELECT (COUNT(*)::int / 2) AS count FROM likes l1 WHERE EXISTS (SELECT 1 FROM likes l2 WHERE l2.from_id = l1.to_id AND l2.to_id = l1.from_id)`
    );
    const totalMatchCount = Number((matchesResult.rows[0] as any)?.count ?? 0);

    const coreCount = coreSubs.count;
    const badgeCount = badgeSubs.count;
    const { core_price, serious_price } = await getPricing();
    const corePrice = parseFloat(core_price);
    const seriousPrice = parseFloat(serious_price);
    const mrr = Math.round((coreCount * corePrice + badgeCount * seriousPrice) * 100) / 100;
    const totalUsersCount = totalUsers.count;
    const subscriptionRate = totalUsersCount > 0 ? Math.round(((coreCount + badgeCount) / totalUsersCount) * 100) : 0;

    res.json({
      totalUsers: totalUsersCount,
      totalEarlyAccess: totalEarlyAccess.count,
      newUsersToday: newToday.count,
      newUsersThisWeek: newThisWeek.count,
      activeSubscriptions: { core: coreCount, badge: badgeCount, total: coreCount + badgeCount },
      mrr,
      totalMessages: totalMessages.count,
      totalMatches: totalMatchCount,
      subscriptionRate,
    });
  } catch (err) {
    logger.error({ err }, "Admin dashboard error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Users ──────────────────────────────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    const { tier, status, country, search, sort = "createdAt", page = "1" } = req.query as Record<string, string>;
    const limit = 25;
    const offset = (Number(page) - 1) * limit;
    const conditions: any[] = [];

    if (tier) conditions.push(eq(schema.users.tier, tier));
    if (status) conditions.push(eq(schema.users.accountStatus, status));
    if (country) conditions.push(eq(schema.users.country, country));
    if (search) conditions.push(or(ilike(schema.users.name, `%${search}%`), ilike(schema.users.email, `%${search}%`)));

    const baseQuery = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db.select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      gender: schema.users.gender,
      birthYear: schema.users.birthYear,
      city: schema.users.city,
      country: schema.users.country,
      tier: schema.users.tier,
      hasBadge: schema.users.hasBadge,
      accountStatus: schema.users.accountStatus,
      completeness: schema.users.completeness,
      createdAt: schema.users.createdAt,
      lastActive: schema.users.lastActive,
    }).from(schema.users).where(baseQuery).orderBy(desc(schema.users.createdAt)).limit(limit).offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.users).where(baseQuery);

    res.json({ rows, total: count });
  } catch (err) {
    logger.error({ err }, "Admin users error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const [row] = await db.select().from(schema.users).where(eq(schema.users.id, req.params.id)).limit(1);
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    const [{ msgCount }] = await db.select({ msgCount: sql<number>`count(*)::int` }).from(schema.messages).where(eq(schema.messages.fromId, req.params.id));
    const [{ likeCount }] = await db.select({ likeCount: sql<number>`count(*)::int` }).from(schema.likes).where(eq(schema.likes.fromId, req.params.id));
    res.json({ ...row, passwordHash: undefined, totalMessages: msgCount, totalLikes: likeCount });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/users/:id/suspend", async (req, res) => {
  try {
    await db.update(schema.users).set({ accountStatus: "suspended" }).where(eq(schema.users.id, req.params.id));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Internal server error" }); }
});

router.patch("/users/:id/ban", async (req, res) => {
  try {
    await db.update(schema.users).set({ accountStatus: "banned" }).where(eq(schema.users.id, req.params.id));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Internal server error" }); }
});

router.patch("/users/:id/reactivate", async (req, res) => {
  try {
    await db.update(schema.users).set({ accountStatus: "active" }).where(eq(schema.users.id, req.params.id));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Internal server error" }); }
});

router.patch("/users/:id/subscription", async (req, res) => {
  try {
    const { tier } = req.body as { tier: string };
    if (!["free", "core", "badge"].includes(tier)) { res.status(400).json({ error: "Invalid tier" }); return; }
    await db.update(schema.users).set({ tier, hasBadge: tier === "badge" }).where(eq(schema.users.id, req.params.id));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Internal server error" }); }
});

router.delete("/users/:id", async (req, res) => {
  try {
    await db.delete(schema.users).where(eq(schema.users.id, req.params.id));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Internal server error" }); }
});

// ── Subscriptions ─────────────────────────────────────────────────────────
router.get("/subscriptions", async (_req, res) => {
  try {
    const [free, core, badge] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(schema.users).where(eq(schema.users.tier, "free")),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.users).where(eq(schema.users.tier, "core")),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.users).where(and(eq(schema.users.tier, "badge"), eq(schema.users.hasBadge, true))),
    ]);
    const coreCount = core[0].count;
    const badgeCount = badge[0].count;
    const { core_price, serious_price } = await getPricing();
    const corePrice = parseFloat(core_price);
    const seriousPrice = parseFloat(serious_price);
    const coreMrr = Math.round(coreCount * corePrice * 100) / 100;
    const badgeMrr = Math.round(badgeCount * seriousPrice * 100) / 100;
    const mrr = Math.round((coreMrr + badgeMrr) * 100) / 100;
    res.json({
      tiers: { free: free[0].count, core: coreCount, badge: badgeCount },
      mrr,
      coreMrr,
      badgeMrr,
      corePrice,
      seriousPrice,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Activity ──────────────────────────────────────────────────────────────
router.get("/activity", async (_req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      [likesToday], [likesWeek], [likesAll],
      [msgsToday], [msgsWeek], [msgsAll],
      matchesAll,
      topUsers,
      geoBreakdown,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(schema.likes).where(gte(schema.likes.createdAt, todayStart)),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.likes).where(gte(schema.likes.createdAt, weekStart)),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.likes),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.messages).where(gte(schema.messages.createdAt, todayStart)),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.messages).where(gte(schema.messages.createdAt, weekStart)),
      db.select({ count: sql<number>`count(*)::int` }).from(schema.messages),
      db.execute(sql`SELECT (COUNT(*)::int / 2) AS count FROM likes l1 WHERE EXISTS (SELECT 1 FROM likes l2 WHERE l2.from_id = l1.to_id AND l2.to_id = l1.from_id)`),
      db.execute(sql`SELECT u.id, u.name, u.email, COUNT(m.id)::int AS msg_count FROM users u LEFT JOIN messages m ON m.from_id = u.id GROUP BY u.id, u.name, u.email ORDER BY msg_count DESC LIMIT 10`),
      db.execute(sql`SELECT country, count(*)::int FROM users WHERE country IS NOT NULL GROUP BY country ORDER BY count DESC LIMIT 20`),
    ]);

    res.json({
      likes: { today: likesToday.count, week: likesWeek.count, allTime: likesAll.count },
      messages: { today: msgsToday.count, week: msgsWeek.count, allTime: msgsAll.count },
      matches: { allTime: Number((matchesAll.rows[0] as any)?.count ?? 0) },
      topUsers: topUsers.rows,
      geoBreakdown: geoBreakdown.rows,
    });
  } catch (err) {
    logger.error({ err }, "Admin activity error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Reports ───────────────────────────────────────────────────────────────
router.get("/reports", async (req, res) => {
  try {
    const { status, page = "1" } = req.query as Record<string, string>;
    const limit = 25;
    const offset = (Number(page) - 1) * limit;

    const condition = status ? eq(schema.reports.status, status) : undefined;

    const rows = await db.execute(sql`
      SELECT r.*, 
        ru.name AS reporter_name, ru.email AS reporter_email,
        rd.name AS reported_name, rd.email AS reported_email
      FROM reports r
      LEFT JOIN users ru ON ru.id = r.reporter_user_id
      LEFT JOIN users rd ON rd.id = r.reported_user_id
      ${status ? sql`WHERE r.status = ${status}` : sql``}
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.reports).where(condition);

    res.json({ rows: rows.rows, total: count });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/reports/:id", async (req, res) => {
  try {
    const { action } = req.body as { action: "dismiss" | "warn" | "suspend" | "ban" };
    const [report] = await db.select().from(schema.reports).where(eq(schema.reports.id, req.params.id)).limit(1);
    if (!report) { res.status(404).json({ error: "Not found" }); return; }

    if (action === "dismiss") {
      await db.update(schema.reports).set({ status: "dismissed" }).where(eq(schema.reports.id, req.params.id));
    } else if (action === "suspend") {
      await Promise.all([
        db.update(schema.reports).set({ status: "actioned" }).where(eq(schema.reports.id, req.params.id)),
        db.update(schema.users).set({ accountStatus: "suspended" }).where(eq(schema.users.id, report.reportedUserId)),
      ]);
    } else if (action === "ban") {
      await Promise.all([
        db.update(schema.reports).set({ status: "actioned" }).where(eq(schema.reports.id, req.params.id)),
        db.update(schema.users).set({ accountStatus: "banned" }).where(eq(schema.users.id, report.reportedUserId)),
      ]);
    } else {
      await db.update(schema.reports).set({ status: "actioned" }).where(eq(schema.reports.id, req.params.id));
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Early Access Emails ───────────────────────────────────────────────────
router.get("/early-access-emails", async (_req, res) => {
  try {
    const result = await db.execute(sql`SELECT id, email, created_at AS "createdAt" FROM early_access ORDER BY created_at DESC`);
    res.json({ rows: result.rows, total: result.rows.length });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/early-access/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(schema.earlyAccess).where(eq(schema.earlyAccess.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err, "Delete early-access error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Settings ──────────────────────────────────────────────────────────────
router.get("/settings", async (_req, res) => {
  try {
    const rows = await db.select().from(schema.settings);
    const result: Record<string, string> = {};
    rows.forEach(r => { result[r.key] = r.value; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/settings", async (req, res) => {
  try {
    const updates = req.body as Record<string, string>;
    const validKeys = [
      "coming_soon_mode", "coming_soon_headline", "coming_soon_subtext",
      "coming_soon_exclusivity", "coming_soon_button_text", "coming_soon_success_message",
      "free_tier_daily_limit", "announcement_banner",
      "core_price", "core_price_label", "core_name", "core_description", "core_features",
      "serious_price", "serious_price_label", "serious_name", "serious_description", "serious_features",
    ];

    for (const [key, value] of Object.entries(updates)) {
      if (!validKeys.includes(key)) continue;
      await db.execute(sql`
        INSERT INTO settings (key, value, updated_at) VALUES (${key}, ${String(value)}, NOW())
        ON CONFLICT (key) DO UPDATE SET value = ${String(value)}, updated_at = NOW()
      `);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Message Prompts ─────────────────────────────────────────────────────────

router.get("/prompts", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(schema.messagePrompts)
      .orderBy(asc(schema.messagePrompts.displayOrder), asc(schema.messagePrompts.id));
    res.json({ prompts: rows });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/prompts", async (req, res) => {
  try {
    const { promptText, displayOrder } = req.body as { promptText: string; displayOrder?: number };
    if (!promptText?.trim()) {
      res.status(400).json({ error: "promptText is required" });
      return;
    }
    const [row] = await db
      .insert(schema.messagePrompts)
      .values({ promptText: promptText.trim(), displayOrder: displayOrder ?? 0 })
      .returning();
    res.json({ prompt: row });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/prompts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    const { promptText, isActive, displayOrder } = req.body as {
      promptText?: string; isActive?: boolean; displayOrder?: number;
    };
    const updates: Partial<typeof schema.messagePrompts.$inferInsert> = {};
    if (promptText !== undefined) updates.promptText = promptText.trim();
    if (isActive !== undefined) updates.isActive = isActive;
    if (displayOrder !== undefined) updates.displayOrder = displayOrder;
    const [row] = await db
      .update(schema.messagePrompts)
      .set(updates)
      .where(eq(schema.messagePrompts.id, id))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ prompt: row });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/prompts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params["id"]!);
    await db.delete(schema.messagePrompts).where(eq(schema.messagePrompts.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Communications ──────────────────────────────────────────────────────────

async function getRecipientsForGroup(group: string): Promise<{ email: string; name: string }[]> {
  const notUnsubscribed = isNull(schema.users.unsubscribedAt);
  const notUnsubscribedEA = isNull(schema.earlyAccess.unsubscribedAt);

  switch (group) {
    case "waitlist": {
      const rows = await db.select({ email: schema.earlyAccess.email }).from(schema.earlyAccess)
        .where(notUnsubscribedEA);
      return rows.map(r => ({ email: r.email, name: "" }));
    }
    case "all_users": {
      return db.select({ email: schema.users.email, name: schema.users.name }).from(schema.users)
        .where(notUnsubscribed);
    }
    case "free_users": {
      return db.select({ email: schema.users.email, name: schema.users.name }).from(schema.users)
        .where(and(eq(schema.users.tier, "free"), notUnsubscribed));
    }
    case "core_users": {
      return db.select({ email: schema.users.email, name: schema.users.name }).from(schema.users)
        .where(and(eq(schema.users.tier, "core"), notUnsubscribed));
    }
    case "badge_users": {
      return db.select({ email: schema.users.email, name: schema.users.name }).from(schema.users)
        .where(and(eq(schema.users.tier, "badge"), eq(schema.users.hasBadge, true), notUnsubscribed));
    }
    case "everyone": {
      const [users, waitlist] = await Promise.all([
        db.select({ email: schema.users.email, name: schema.users.name }).from(schema.users)
          .where(notUnsubscribed),
        db.select({ email: schema.earlyAccess.email }).from(schema.earlyAccess)
          .where(notUnsubscribedEA),
      ]);
      const knownEmails = new Set(users.map(u => u.email));
      const extra = waitlist.filter(w => !knownEmails.has(w.email)).map(w => ({ email: w.email, name: "" }));
      return [...users, ...extra];
    }

    // ── Smart segments ───────────────────────────────────────────────────────
    case "inactive_30d":
      return db.select({ email: schema.users.email, name: schema.users.name })
        .from(schema.users)
        .where(and(lt(schema.users.lastActive, sql`NOW() - INTERVAL '30 days'`), notUnsubscribed));

    case "inactive_14d":
      return db.select({ email: schema.users.email, name: schema.users.name })
        .from(schema.users)
        .where(and(lt(schema.users.lastActive, sql`NOW() - INTERVAL '14 days'`), notUnsubscribed));

    case "incomplete_profiles":
      return db.select({ email: schema.users.email, name: schema.users.name })
        .from(schema.users)
        .where(and(
          notUnsubscribed,
          or(
            isNull(schema.users.photoUrl),
            isNull(schema.users.bio),
            sql`cardinality(${schema.users.heritage}) = 0`,
          ),
        ));

    case "no_matches": {
      const result = await db.execute(sql`
        SELECT u.email, u.name
        FROM users u
        WHERE u.unsubscribed_at IS NULL
          AND u.id NOT IN (
            SELECT DISTINCT l1.from_id
            FROM likes l1
            INNER JOIN likes l2
              ON l1.from_id = l2.to_id AND l1.to_id = l2.from_id
          )
      `);
      return (result.rows as { email: string; name: string }[]);
    }

    case "free_never_upgraded":
      return db.select({ email: schema.users.email, name: schema.users.name })
        .from(schema.users)
        .where(and(
          eq(schema.users.tier, "free"),
          lt(schema.users.createdAt, sql`NOW() - INTERVAL '14 days'`),
          notUnsubscribed,
        ));

    case "new_this_week":
      return db.select({ email: schema.users.email, name: schema.users.name })
        .from(schema.users)
        .where(and(gte(schema.users.createdAt, sql`NOW() - INTERVAL '7 days'`), notUnsubscribed));

    case "waitlist_not_registered": {
      const [waitlist, regUsers] = await Promise.all([
        db.select({ email: schema.earlyAccess.email }).from(schema.earlyAccess)
          .where(notUnsubscribedEA),
        db.select({ email: schema.users.email }).from(schema.users),
      ]);
      const registered = new Set(regUsers.map(u => u.email));
      return waitlist.filter(w => !registered.has(w.email)).map(w => ({ email: w.email, name: "" }));
    }

    default:
      return [];
  }
}

async function sendInBatches(
  recipients: { email: string; name: string }[],
  subject: string,
  body: string,
  ctaLabel?: string,
  ctaUrl?: string,
): Promise<{ sent: number; failed: number }> {
  const BATCH = 50;
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(({ email, name }) => sendBroadcastEmail(email, name, subject, body, ctaLabel, ctaUrl)),
    );
    sent   += results.filter(r => r.status === "fulfilled").length;
    failed += results.filter(r => r.status === "rejected").length;
    if (i + BATCH < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return { sent, failed };
}

router.get("/communications/preview", async (req, res) => {
  try {
    const group = (req.query.group as string) || "all_users";
    const recipients = await getRecipientsForGroup(group);
    res.json({ count: recipients.length });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/communications/broadcast", async (req, res) => {
  try {
    const logs = await db
      .select()
      .from(schema.broadcastLogs)
      .orderBy(desc(schema.broadcastLogs.createdAt))
      .limit(100);
    res.json({ logs });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/communications/broadcast", async (req, res) => {
  try {
    const { subject, body, recipientGroup, ctaLabel, ctaUrl } = req.body as {
      subject: string; body: string; recipientGroup: string;
      ctaLabel?: string; ctaUrl?: string;
    };
    if (!subject?.trim() || !body?.trim() || !recipientGroup) {
      res.status(400).json({ error: "subject, body, and recipientGroup are required" });
      return;
    }
    const recipients = await getRecipientsForGroup(recipientGroup);
    if (recipients.length === 0) {
      res.status(400).json({ error: "No recipients found for this group" });
      return;
    }

    const { sent, failed } = await sendInBatches(recipients, subject, body, ctaLabel, ctaUrl);

    await db.insert(schema.broadcastLogs).values({
      id: uuidv4(),
      subject: subject.trim(),
      body: body.trim(),
      recipientGroup,
      recipientCount: recipients.length,
      sentCount: sent,
      failedCount: failed,
      status: failed === 0 ? "sent" : sent === 0 ? "failed" : "partial",
      ctaLabel: ctaLabel || null,
      ctaUrl: ctaUrl || null,
    });

    res.json({ sent, failed, total: recipients.length });
  } catch (err) {
    logger.error(err, "Broadcast error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/communications/preview-html", async (req, res) => {
  try {
    const { subject, body, ctaLabel, ctaUrl } = req.body as {
      subject?: string; body?: string; ctaLabel?: string; ctaUrl?: string;
    };
    const safeBody = (body || "(no content)")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .split("\n")
      .map((line: string) =>
        line.trim() === "" ? "<br />" :
        `<p style="margin: 0 0 16px; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.8; color: #5a3a3a;">${line}</p>`)
      .join("\n");

    const html = buildBroadcastHtml({
      firstName: "there",
      subject: subject?.trim() || "(no subject)",
      bodyHtml: safeBody,
      ctaLabel: ctaLabel?.trim() || undefined,
      ctaUrl:   ctaUrl?.trim()   || undefined,
      email: "preview@dowry.africa",
    });
    res.json({ html });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/communications/templates", async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(schema.emailTemplates)
      .orderBy(desc(schema.emailTemplates.createdAt));
    res.json({ templates: rows });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/communications/templates", async (req, res) => {
  try {
    const { name, subject, body, ctaLabel, ctaUrl } = req.body as {
      name: string; subject: string; body: string; ctaLabel?: string; ctaUrl?: string;
    };
    if (!name?.trim() || !subject?.trim() || !body?.trim()) {
      res.status(400).json({ error: "name, subject, and body are required" });
      return;
    }
    const [row] = await db.insert(schema.emailTemplates).values({
      id: uuidv4(),
      name: name.trim(),
      subject: subject.trim(),
      body: body.trim(),
      ctaLabel: ctaLabel?.trim() || null,
      ctaUrl: ctaUrl?.trim() || null,
    }).returning();
    res.json({ template: row });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/communications/templates/:id", async (req, res) => {
  try {
    await db.delete(schema.emailTemplates).where(eq(schema.emailTemplates.id, req.params.id!));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/communications/user/:userId", async (req, res) => {
  try {
    const { subject, message } = req.body as { subject: string; message: string };
    if (!subject?.trim() || !message?.trim()) {
      res.status(400).json({ error: "subject and message are required" });
      return;
    }
    const [user] = await db
      .select({ id: schema.users.id, email: schema.users.email, name: schema.users.name })
      .from(schema.users)
      .where(eq(schema.users.id, req.params.userId!))
      .limit(1);
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    await sendAdminDirectEmail(user.email, user.name, subject.trim(), message.trim());
    res.json({ success: true });
  } catch (err) {
    logger.error(err, "Admin direct email error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
