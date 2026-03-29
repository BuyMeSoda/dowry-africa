import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";
import { requireAdmin } from "../middlewares/adminAuth.js";

const router = Router();

// Public: get coming-soon page content from settings
router.get("/config", async (_req, res) => {
  try {
    const rows = await db.select().from(schema.settings);
    const data: Record<string, string> = {};
    rows.forEach(r => { data[r.key] = r.value; });
    res.json({
      comingSoonMode: data["coming_soon_mode"] === "true",
      headline: data["coming_soon_headline"] ?? "Built for marriage. Not just matches.",
      subtext: data["coming_soon_subtext"] ?? "",
      exclusivity: data["coming_soon_exclusivity"] ?? "",
      buttonText: data["coming_soon_button_text"] ?? "Request early access",
      successMessage: data["coming_soon_success_message"] ?? "You're on the list.",
    });
  } catch {
    res.json({ comingSoonMode: false });
  }
});

// Public: submit email for early access
router.post("/", async (req, res) => {
  try {
    const { email } = req.body as { email?: string };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: "Please enter a valid email address" });
      return;
    }

    const normalised = email.toLowerCase().trim();
    const existing = await db
      .select({ id: schema.earlyAccess.id })
      .from(schema.earlyAccess)
      .where(eq(schema.earlyAccess.email, normalised))
      .limit(1);

    if (existing.length > 0) {
      res.status(200).json({ success: true, alreadyRegistered: true });
      return;
    }

    await db.insert(schema.earlyAccess).values({
      id: uuidv4(),
      email: normalised,
    });

    res.status(201).json({ success: true, alreadyRegistered: false });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(200).json({ success: true, alreadyRegistered: true });
      return;
    }
    console.error("Early access submit error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: list all early access emails
router.get("/", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(schema.earlyAccess)
      .orderBy(desc(schema.earlyAccess.createdAt));
    res.json({ rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Admin: export early access emails as CSV
router.get("/export", requireAdmin, async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(schema.earlyAccess)
      .orderBy(desc(schema.earlyAccess.createdAt));

    const csv = ["email,submitted_at", ...rows.map(r =>
      `${r.email},${r.createdAt.toISOString()}`
    )].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="early-access-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
