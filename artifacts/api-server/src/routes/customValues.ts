import { Router } from "express";
import { eq, and, ilike, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// ── Faith normalization ───────────────────────────────────────────────────────
const FAITH_CHRISTIAN = ["born again", "pentecostal", "baptist", "anglican", "catholic",
  "presbyterian", "methodist", "evangelical", "protestant", "lutheran", "reformed",
  "seventh day", "adventist", "charismatic", "apostolic", "jehovah", "orthodox christian"];
const FAITH_MUSLIM = ["sunni", "shia", "shi'a", "ahmadiyya", "sufi", "salafi", "hanafi",
  "maliki", "shafi'i", "hanbali"];

function normalizeFaith(value: string): string {
  const lower = value.toLowerCase().trim();
  if (FAITH_CHRISTIAN.some(v => lower.includes(v))) return "Christian";
  if (FAITH_MUSLIM.some(v => lower.includes(v))) return "Muslim";
  return toTitleCase(value);
}

function toTitleCase(s: string): string {
  return s.trim().replace(/\b\w/g, c => c.toUpperCase());
}

function normalizeValue(fieldType: string, displayValue: string): string {
  if (fieldType === "faith") return normalizeFaith(displayValue);
  return toTitleCase(displayValue); // heritage: store as-is, title cased
}

// ─────────────────────────────────────────────────────────────────────────────

// GET /api/custom-values?field_type=heritage&prefix=ango
router.get("/", requireAuth, async (req, res) => {
  try {
    const { field_type, prefix } = req.query as Record<string, string>;
    if (!field_type) { res.status(400).json({ error: "field_type required" }); return; }

    const conditions = [eq(schema.customValues.fieldType, field_type)];
    if (prefix?.trim()) {
      conditions.push(ilike(schema.customValues.displayValue, `${prefix.trim()}%`));
    }

    const rows = await db
      .select()
      .from(schema.customValues)
      .where(and(...conditions))
      .orderBy(sql`usage_count DESC`)
      .limit(10);

    res.json({ values: rows.map(r => ({ display_value: r.displayValue, normalized_value: r.normalizedValue })) });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/custom-values — create or increment usage
router.post("/", requireAuth, async (req, res) => {
  try {
    const { field_type, display_value, normalized_value } = req.body as {
      field_type: string;
      display_value: string;
      normalized_value?: string;
    };

    if (!field_type || !display_value?.trim()) {
      res.status(400).json({ error: "field_type and display_value required" });
      return;
    }

    const displayClean = toTitleCase(display_value);
    const normalized = normalized_value?.trim() || normalizeValue(field_type, displayClean);

    await db.execute(sql`
      INSERT INTO custom_values (id, field_type, display_value, normalized_value, usage_count)
      VALUES (${uuidv4()}, ${field_type}, ${displayClean}, ${normalized}, 1)
      ON CONFLICT (field_type, display_value)
      DO UPDATE SET usage_count = custom_values.usage_count + 1
    `);

    res.json({ ok: true, display_value: displayClean, normalized_value: normalized });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
