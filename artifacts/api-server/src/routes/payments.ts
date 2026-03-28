import { Router } from "express";
import { users } from "../db/database.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

function isDemoMode(): boolean {
  const key = process.env["STRIPE_SECRET_KEY"];
  return !key || key.includes("YOUR_") || key.startsWith("sk_test_placeholder");
}

router.post("/create-checkout", requireAuth, async (req, res) => {
  const me = users.get(req.userId!);
  if (!me) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { tier } = req.body;
  if (!tier || !["core", "badge"].includes(tier)) {
    res.status(400).json({ error: "Invalid tier. Must be 'core' or 'badge'" });
    return;
  }

  if (isDemoMode()) {
    me.tier = tier as "core" | "badge";
    me.hasBadge = tier === "badge";
    res.json({ demo: true, tier, url: null });
    return;
  }

  try {
    const stripe = await import("stripe");
    const client = new (stripe.default)(process.env["STRIPE_SECRET_KEY"]!);

    const priceId = tier === "core"
      ? process.env["STRIPE_CORE_PRICE_ID"]
      : process.env["STRIPE_BADGE_PRICE_ID"];

    if (!priceId) {
      me.tier = tier as "core" | "badge";
      me.hasBadge = tier === "badge";
      res.json({ demo: true, tier, url: null });
      return;
    }

    const domain = process.env["REPLIT_DOMAINS"]?.split(",")[0] ?? "localhost:80";
    const session = await client.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `https://${domain}/premium?success=true&tier=${tier}`,
      cancel_url: `https://${domain}/premium`,
      metadata: { userId: me.id, tier },
    });

    res.json({ url: session.url, demo: false, tier });
  } catch (err) {
    req.log.error(err, "Stripe checkout error");
    me.tier = tier as "core" | "badge";
    me.hasBadge = tier === "badge";
    res.json({ demo: true, tier, url: null });
  }
});

router.post("/webhook", async (req, res) => {
  const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];
  if (!webhookSecret || isDemoMode()) {
    res.json({ ok: true });
    return;
  }

  try {
    const stripe = await import("stripe");
    const client = new (stripe.default)(process.env["STRIPE_SECRET_KEY"]!);
    const sig = req.headers["stripe-signature"] as string;
    const event = client.webhooks.constructEvent(req.body, sig, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;
      const { userId, tier } = session.metadata ?? {};
      if (userId && tier && users.has(userId)) {
        const user = users.get(userId)!;
        user.tier = tier;
        user.hasBadge = tier === "badge";
      }
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: "Webhook error" });
  }
});

router.get("/status", requireAuth, (req, res) => {
  const me = users.get(req.userId!);
  if (!me) { res.status(401).json({ error: "Unauthorized" }); return; }
  res.json({ tier: me.tier, hasBadge: me.hasBadge });
});

export default router;
