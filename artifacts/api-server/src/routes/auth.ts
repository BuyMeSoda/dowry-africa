import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { users, getUserByEmail, sanitizeUser, updateUserCompleteness } from "../db/database.js";
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

    if (getUserByEmail(email)) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const id = uuidv4();
    const now = new Date();

    const user = {
      id,
      email,
      passwordHash,
      name,
      gender,
      birthYear: Number(birthYear),
      age: new Date().getFullYear() - Number(birthYear),
      heritage: [] as string[],
      languages: [] as string[],
      tier: "free" as const,
      hasBadge: false,
      completeness: 0,
      lastActive: now,
      createdAt: now,
      blocked: [] as string[],
    };

    updateUserCompleteness(user as any);
    users.set(id, user as any);

    const token = makeToken(id);
    res.status(201).json({ token, user: sanitizeUser(user as any) });
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

    const user = getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    let valid = false;
    if (user.passwordHash === "$demo$") {
      valid = password === "demo";
    } else {
      valid = await bcrypt.compare(password, user.passwordHash);
    }

    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    user.lastActive = new Date();
    const token = makeToken(user.id);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    req.log.error(err, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", requireAuth, (req, res) => {
  const user = users.get(req.userId!);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json(sanitizeUser(user));
});

export default router;
