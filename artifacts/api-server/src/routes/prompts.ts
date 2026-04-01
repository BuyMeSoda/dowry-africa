import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";

const router = Router();

const FALLBACK_PROMPTS = [
  "What does family mean to you?",
  "What role does faith play in your daily life?",
  "What traditions do you want to carry into your marriage?",
];

router.get("/", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(schema.messagePrompts)
      .where(eq(schema.messagePrompts.isActive, true));

    const active = rows.length > 0 ? rows : [];
    const shuffled = [...active].sort(() => Math.random() - 0.5).slice(0, 3);
    const prompts = shuffled.map(r => r.promptText);
    res.json({ prompts: prompts.length > 0 ? prompts : FALLBACK_PROMPTS });
  } catch {
    res.json({ prompts: FALLBACK_PROMPTS });
  }
});

export default router;
