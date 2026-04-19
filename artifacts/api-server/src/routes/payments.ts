import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";
import { toUser } from "../db/database.js";
import { requireAuth, requireApproved } from "../middlewares/auth.js";
import { isAdminEmail, applyAdminOverride } from "../lib/adminUtils.js";

const router = Router();

function isDemoMode(): boolean {
  const key = process.env["STRIPE_SECRET_KEY"];
  return !key || key.includes("YOUR_") || key.startsWith("sk_test_placeholder");
}

router.post("/create-checkout", requireAuth, requireApproved, async (req, res) => {
  try {
    const [meRow] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .limit(1);

    if (!meRow) { res.status(401).json({ error: "Unauthorized" }); return; }
    const me = toUser(meRow);

    const { tier } = req.body;
    if (!tier || !["core", "badge"].includes(tier)) {
      res.status(400).json({ error: "Invalid tier. Must be 'core' or 'badge'" });
      return;
    }

    if (isDemoMode()) {
      await db.update(schema.users)
        .set({ tier, hasBadge: tier === "badge" })
        .where(eq(schema.users.id, me.id));
      res.json({ demo: true, tier, url: null });
      return;
    }

    const stripe = await import("stripe");
    const client = new (stripe.default)(process.env["STRIPE_SECRET_KEY"]!);

    const priceId = tier === "core"
      ? process.env["STRIPE_CORE_PRICE_ID"]
      : process.env["STRIPE_BADGE_PRICE_ID"];

    if (!priceId) {
      await db.update(schema.users)
        .set({ tier, hasBadge: tier === "badge" })
        .where(eq(schema.users.id, me.id));
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
    res.status(500).json({ error: "Could not create checkout session. Please try again." });
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
      if (userId && tier) {
        await db.update(schema.users)
          .set({
            tier,
            hasBadge: tier === "badge",
            ...(session.customer ? { stripeCustomerId: session.customer } : {}),
          })
          .where(eq(schema.users.id, userId));
      }
    }

    if (event.type === "customer.subscription.deleted" || event.type === "customer.subscription.updated") {
      const subscription = event.data.object as any;
      const customerId = subscription.customer;
      const status = subscription.status;

      if (event.type === "customer.subscription.deleted" || status === "canceled" || status === "unpaid") {
        await db.update(schema.users)
          .set({ tier: "free", hasBadge: false })
          .where(eq(schema.users.stripeCustomerId, customerId));
      }
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: "Webhook error" });
  }
});

router.post("/create-portal", requireAuth, requireApproved, async (req, res) => {
  try {
    const [meRow] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .limit(1);

    if (!meRow) { res.status(401).json({ error: "Unauthorized" }); return; }
    const me = toUser(meRow);

    if (isDemoMode()) {
      res.status(400).json({ error: "Billing portal is not available in demo mode." });
      return;
    }

    const stripe = await import("stripe");
    const client = new (stripe.default)(process.env["STRIPE_SECRET_KEY"]!);

    let customerId = me.stripeCustomerId;
    if (!customerId) {
      const results = await client.customers.list({ email: me.email, limit: 1 });
      if (results.data.length === 0) {
        res.status(400).json({ error: "No Stripe subscription found. Please subscribe first." });
        return;
      }
      customerId = results.data[0].id;
      await db.update(schema.users)
        .set({ stripeCustomerId: customerId })
        .where(eq(schema.users.id, me.id));
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

router.get("/status", requireAuth, requireApproved, async (req, res) => {
  try {
    const [meRow] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .limit(1);

    if (!meRow) { res.status(401).json({ error: "Unauthorized" }); return; }
    const me = toUser(meRow);

    if (me.tier === "free" && !isDemoMode()) {
      try {
        const stripe = await import("stripe");
        const client = new (stripe.default)(process.env["STRIPE_SECRET_KEY"]!);
        const results = await client.customers.list({ email: me.email, limit: 1 });
        if (results.data.length > 0) {
          const customer = results.data[0];
          const subs = await client.subscriptions.list({ customer: customer.id, status: "active", limit: 1 });
          if (subs.data.length > 0) {
            const sub = subs.data[0];
            const priceId = sub.items.data[0]?.price?.id;
            const badgePriceId = process.env["STRIPE_BADGE_PRICE_ID"];
            const corePriceId = process.env["STRIPE_CORE_PRICE_ID"];
            let newTier = me.tier;
            let newBadge = me.hasBadge;
            if (priceId === badgePriceId) { newTier = "badge"; newBadge = true; }
            else if (priceId === corePriceId) { newTier = "core"; newBadge = false; }

            if (newTier !== me.tier) {
              await db.update(schema.users)
                .set({ tier: newTier, hasBadge: newBadge, stripeCustomerId: customer.id })
                .where(eq(schema.users.id, me.id));
              return res.json({ tier: newTier, hasBadge: newBadge });
            }
          }
        }
      } catch {
        // Stripe sync failed — return current DB state
      }
    }

    if (await isAdminEmail(me.email)) {
      const overridden = applyAdminOverride({ tier: me.tier, hasBadge: me.hasBadge });
      return res.json({ tier: overridden.tier, hasBadge: overridden.hasBadge });
    }

    res.json({ tier: me.tier, hasBadge: me.hasBadge });
  } catch (err) {
    req.log.error(err, "Payment status error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
