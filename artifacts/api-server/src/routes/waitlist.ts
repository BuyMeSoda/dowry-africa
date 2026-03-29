import { Router } from "express";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";

const router = Router();

router.get("/status", async (_req, res) => {
  try {
    const [row] = await db
      .select()
      .from(schema.settings)
      .where(eq(schema.settings.key, "waitlist_mode"))
      .limit(1);

    res.json({ waitlistMode: row?.value === "true" });
  } catch (err) {
    res.json({ waitlistMode: false });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      fullName, age, city, country, email,
      intention, timeline,
      willingProfile, willingVerify, willingRespect,
      faith, openToDistance, heritage, diasporaPreference,
      whyJoining, referralSource, referralCode,
    } = req.body;

    if (!fullName || !age || !city || !country || !email || !intention || !timeline || !whyJoining) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    if (Number(age) < 21) {
      res.status(400).json({ error: "Minimum age is 21" });
      return;
    }

    if (whyJoining.length < 50) {
      res.status(400).json({ error: "Please elaborate on why you want to join (min 50 characters)" });
      return;
    }

    const existing = await db
      .select({ id: schema.waitlist.id })
      .from(schema.waitlist)
      .where(eq(schema.waitlist.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      res.status(400).json({ error: "This email is already on the waitlist" });
      return;
    }

    const allWilling = willingProfile && willingVerify && willingRespect;
    const priority = allWilling ? "high" : "low";

    await db.insert(schema.waitlist).values({
      id: uuidv4(),
      fullName: fullName.trim(),
      age: Number(age),
      city: city.trim(),
      country: country.trim(),
      email: email.toLowerCase().trim(),
      intention,
      timeline,
      willingProfile: !!willingProfile,
      willingVerify: !!willingVerify,
      willingRespect: !!willingRespect,
      faith: faith || null,
      openToDistance: openToDistance != null ? !!openToDistance : null,
      heritage: heritage || null,
      diasporaPreference: diasporaPreference || null,
      whyJoining: whyJoining.trim(),
      referralSource: referralSource || null,
      referralCode: referralCode || null,
      priority,
      status: "pending",
    });

    console.log(`[Waitlist] New application from ${email} — priority: ${priority}`);

    res.status(201).json({ success: true, priority });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(400).json({ error: "This email is already on the waitlist" });
      return;
    }
    console.error("Waitlist submit error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
