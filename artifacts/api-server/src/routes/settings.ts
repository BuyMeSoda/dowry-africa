import { Router } from "express";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";

const router = Router();

export const PRICING_DEFAULTS = {
  core_price: "12.99",
  core_price_label: "$12.99/month",
  core_price_yearly: "9.99",
  core_price_label_yearly: "$9.99/month billed annually",
  core_name: "Core",
  core_description: "For members who are serious about finding a committed partner.",
  core_features: JSON.stringify([
    "Unlimited profiles",
    "See who liked you",
    "Unlimited messaging",
    "Advanced country filters",
  ]),
  serious_price: "19.99",
  serious_price_label: "$19.99/month",
  serious_price_yearly: "15.99",
  serious_price_label_yearly: "$15.99/month billed annually",
  serious_name: "Serious Badge",
  serious_description: "For members who want to demonstrate the highest level of intent.",
  serious_features: JSON.stringify([
    "Everything in Core",
    "Serious Badge on your profile",
    "Ranked highest in feeds",
    "Access to Badge-only pool",
  ]),
};

const PRICING_KEYS = new Set(Object.keys(PRICING_DEFAULTS));

export async function getPricing(): Promise<typeof PRICING_DEFAULTS & Record<string, string>> {
  const rows = await db.select().from(schema.settings);
  const stored: Record<string, string> = {};
  rows.forEach(r => {
    if (PRICING_KEYS.has(r.key)) stored[r.key] = r.value;
  });
  return { ...PRICING_DEFAULTS, ...stored };
}

export const APP_FLAG_DEFAULTS = {
  free_daily_message_limit: "3",
  free_daily_like_limit: "10",
  payments_live: "false",
};

export interface AppFlags {
  paymentsLive: boolean;
  freeDailyMessageLimit: number;
  freeDailyLikeLimit: number;
}

const APP_FLAG_KEYS = new Set(Object.keys(APP_FLAG_DEFAULTS));

export async function getAppFlags(): Promise<AppFlags> {
  const rows = await db.select().from(schema.settings);
  const stored: Record<string, string> = { ...APP_FLAG_DEFAULTS };
  rows.forEach(r => { if (APP_FLAG_KEYS.has(r.key)) stored[r.key] = r.value; });

  const messageLimit = parseInt(stored["free_daily_message_limit"]!, 10);
  const likeLimit = parseInt(stored["free_daily_like_limit"]!, 10);
  return {
    paymentsLive: stored["payments_live"] === "true",
    freeDailyMessageLimit: Number.isFinite(messageLimit) && messageLimit >= 0 ? messageLimit : 3,
    freeDailyLikeLimit: Number.isFinite(likeLimit) && likeLimit >= 0 ? likeLimit : 10,
  };
}

router.get("/pricing", async (_req, res) => {
  try {
    const pricing = await getPricing();
    res.json(pricing);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
