import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";
import { toUser, sanitizeUser, calcCompleteness } from "../db/database.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

function makeToken(userId: string) {
  const secret = process.env["JWT_SECRET"]!;
  return jwt.sign({ userId }, secret, { expiresIn: "30d" });
}

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, gender, birthYear } = req.body;

    if (!email || !password || !name || !gender || !birthYear) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const existing = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const id = uuidv4();
    const now = new Date();
    const bYear = Number(birthYear);

    const partial = {
      bio: undefined as string | undefined,
      quote: undefined as string | undefined,
      photoUrl: undefined as string | undefined,
      city: undefined as string | undefined,
      country: undefined as string | undefined,
      faith: undefined as string | undefined,
      intent: undefined as string | undefined,
      lifeStage: undefined as string | undefined,
      childrenPref: undefined as string | undefined,
      marriageTimeline: undefined as string | undefined,
    };
    const completeness = calcCompleteness(partial);

    await db.insert(schema.users).values({
      id,
      email: email.toLowerCase(),
      passwordHash,
      name,
      gender,
      birthYear: bYear,
      heritage: [],
      languages: [],
      tier: "free",
      hasBadge: false,
      completeness,
      lastActive: now,
      createdAt: now,
      blocked: [],
    });

    const [row] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    const user = toUser(row);
    const token = makeToken(id);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    req.log.error(err, "Register error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    const [row] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()))
      .limit(1);

    if (!row) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    let valid = false;
    if (row.passwordHash === "$demo$") {
      valid = password === "demo";
    } else {
      valid = await bcrypt.compare(password, row.passwordHash);
    }

    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    await db
      .update(schema.users)
      .set({ lastActive: new Date() })
      .where(eq(schema.users.id, row.id));

    const user = toUser({ ...row, lastActive: new Date() });
    const token = makeToken(user.id);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    req.log.error(err, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .limit(1);

    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(sanitizeUser(toUser(row)));
  } catch (err) {
    req.log.error(err, "Get me error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
