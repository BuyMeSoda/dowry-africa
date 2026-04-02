import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import passport from "passport";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";
import { toUser, sanitizeUser, calcCompleteness } from "../db/database.js";
import { requireAuth } from "../middlewares/auth.js";
import type { User } from "../db/database.js";

const router = Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in 15 minutes." },
});

function makeToken(userId: string) {
  const secret = process.env["JWT_SECRET"]!;
  return jwt.sign({ userId }, secret, { expiresIn: "7d" });
}

router.post("/register", authRateLimit, async (req, res) => {
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

router.post("/login", authRateLimit, async (req, res) => {
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

// ── Google OAuth ──────────────────────────────────────────────────────────────

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: true }),
  (_req, res) => {
    res.redirect("/dashboard");
  },
);

// ── Current session user ──────────────────────────────────────────────────────

router.get("/me", (req, res) => {
  if (!req.isAuthenticated() || !req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json(sanitizeUser(req.user as User));
});

// ── Logout ────────────────────────────────────────────────────────────────────

router.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      req.log.error(err, "Logout error");
    }
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
});

export default router;
