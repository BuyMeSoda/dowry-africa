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
        if (session.customer) user.stripeCustomerId = session.customer;
      }
    }

    if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
      const subscription = event.data.object as any;
      const customerId = subscription.customer;
      for (const user of users.values()) {
        if (user.stripeCustomerId === customerId) {
          const status = subscription.status;
          if (event.type === "customer.subscription.deleted" || status === "canceled" || status === "unpaid") {
            user.tier = "free";
            user.hasBadge = false;
          }
          break;
        }
      }
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: "Webhook error" });
  }
});

router.post("/create-portal", requireAuth, async (req, res) => {
  const me = users.get(req.userId!);
  if (!me) { res.status(401).json({ error: "Unauthorized" }); return; }

  if (isDemoMode()) {
    res.status(400).json({ error: "Billing portal is not available in demo mode." });
    return;
  }

  try {
    const stripe = await import("stripe");
    const client = new (stripe.default)(process.env["STRIPE_SECRET_KEY"]!);

    // Resolve customer ID — use stored value or look up by email as fallback
    let customerId = me.stripeCustomerId;
    if (!customerId) {
      const results = await client.customers.list({ email: me.email, limit: 1 });
      if (results.data.length === 0) {
        res.status(400).json({ error: "No Stripe subscription found. Please subscribe first." });
        return;
      }
      customerId = results.data[0].id;
      me.stripeCustomerId = customerId; // cache for next time
    }

    const domain = process.env["REPLIT_DOMAINS"]?.split(",")[0] ?? "localhost:80";
    const session = await client.billingPortal.sessions.create({
      customer: customerId,
      return_url: `https://${domain}/premium`,
    });
    res.json({ url: session.url });
  } catch (err) {
    req.log.error(err, "Stripe portal error");
    res.status(500).json({ error: "Could not open billing portal." });
  }
});

router.get("/status", requireAuth, async (req, res) => {
  const me = users.get(req.userId!);
  if (!me) { res.status(401).json({ error: "Unauthorized" }); return; }

  // If tier appears as free but Stripe is configured, sync from Stripe in case the
  // server restarted and lost in-memory state after a prior payment.
  if (me.tier === "free" && !isDemoMode()) {
    try {
      const stripe = await import("stripe");
      const client = new (stripe.default)(process.env["STRIPE_SECRET_KEY"]!);
      const results = await client.customers.list({ email: me.email, limit: 1 });
      if (results.data.length > 0) {
        const customer = results.data[0];
        me.stripeCustomerId = customer.id;
        const subs = await client.subscriptions.list({ customer: customer.id, status: "active", limit: 1 });
        if (subs.data.length > 0) {
          const sub = subs.data[0];
          const priceId = sub.items.data[0]?.price?.id;
          const badgePriceId = process.env["STRIPE_BADGE_PRICE_ID"];
          const corePriceId = process.env["STRIPE_CORE_PRICE_ID"];
          if (priceId === badgePriceId) { me.tier = "badge"; me.hasBadge = true; }
          else if (priceId === corePriceId) { me.tier = "core"; me.hasBadge = false; }
        }
      }
    } catch {
      // Stripe sync failed — return current in-memory state
    }
  }

  res.json({ tier: me.tier, hasBadge: me.hasBadge });
});

export default router;
