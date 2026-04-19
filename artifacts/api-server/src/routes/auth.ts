import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import rateLimit from "express-rate-limit";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";
import { toUser, sanitizeUser, calcCompleteness } from "../db/database.js";
import { requireAuth } from "../middlewares/auth.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../lib/email.js";

const APP_BASE = process.env["FRONTEND_URL"] ?? "https://dowry.africa";

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

function validatePasswordStrength(password: string): string | null {
  if (password.length < 8)              return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password))          return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(password))          return "Password must contain at least one lowercase letter.";
  if (!/[0-9]/.test(password))          return "Password must contain at least one number.";
  if (!/[!@#$%^&*()\-_=+\[\]{}|;:,.<>?]/.test(password))
                                         return "Password must contain at least one special character.";
  return null;
}

router.post("/register", authRateLimit, async (req, res) => {
  try {
    const { email, password, name, gender, birthYear } = req.body;

    if (!email || !password || !name || !gender || !birthYear) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    const pwError = validatePasswordStrength(password);
    if (pwError) {
      res.status(400).json({ error: pwError });
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

    const verificationToken = randomBytes(32).toString("hex");
    const verificationTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Check if manual approval is required
    const [approvalSetting] = await db
      .select({ value: schema.settings.value })
      .from(schema.settings)
      .where(eq(schema.settings.key, "manual_approval_required"))
      .limit(1);
    const manualApprovalRequired = approvalSetting?.value !== "false";
    const accountStatus = manualApprovalRequired ? "pending" : "approved";

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
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry,
      accountStatus,
      approvedAt: manualApprovalRequired ? undefined : now,
    });

    const [row] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    const user = toUser(row);
    const jwtToken = makeToken(id);

    // Fire-and-forget — never block the signup response on email delivery
    const verificationLink = `${APP_BASE}/verify-email?token=${verificationToken}`;
    sendVerificationEmail(email.toLowerCase(), name, verificationLink).catch(
      (err) => req.log.warn(err, "Verification email failed to send"),
    );

    res.status(201).json({ token: jwtToken, user: sanitizeUser(user) });
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

    // Block suspended, banned, and rejected accounts from logging in at all
    if (row.accountStatus === "suspended") {
      res.status(403).json({ error: "Your account has been suspended. Please contact hello@dowry.africa if you believe this is a mistake." });
      return;
    }
    if (row.accountStatus === "banned") {
      res.status(403).json({ error: "Your account has been permanently banned." });
      return;
    }
    if (row.accountStatus === "rejected") {
      res.status(403).json({ error: "Your application was not approved. If you believe this is a mistake, please contact hello@dowry.africa." });
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

router.post("/forgot-password", authRateLimit, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: "Email required" });
      return;
    }

    const successMsg = { message: "If an account exists with this email, you will receive a reset link shortly. Check your inbox." };

    const [row] = await db
      .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()))
      .limit(1);

    if (!row) {
      // Always return success to prevent email enumeration
      res.json(successMsg);
      return;
    }

    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db
      .update(schema.users)
      .set({ resetToken, resetTokenExpiry })
      .where(eq(schema.users.id, row.id));

    const frontendUrl = process.env["FRONTEND_URL"] ?? "https://dowry.africa";
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    sendPasswordResetEmail(row.email, row.name, resetLink).catch(
      (err) => req.log.warn(err, "Password reset email failed to send"),
    );

    res.json(successMsg);
  } catch (err) {
    req.log.error(err, "Forgot password error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: "Token and new password required" });
      return;
    }

    const pwError = validatePasswordStrength(newPassword);
    if (pwError) {
      res.status(400).json({ error: pwError });
      return;
    }

    const [row] = await db
      .select({ id: schema.users.id, resetToken: schema.users.resetToken, resetTokenExpiry: schema.users.resetTokenExpiry })
      .from(schema.users)
      .where(eq(schema.users.resetToken, token))
      .limit(1);

    if (!row || !row.resetTokenExpiry || row.resetTokenExpiry < new Date()) {
      res.status(400).json({ error: "This link is invalid or has expired." });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await db
      .update(schema.users)
      .set({ passwordHash, resetToken: null, resetTokenExpiry: null })
      .where(eq(schema.users.id, row.id));

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    req.log.error(err, "Reset password error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query as { token?: string };
    if (!token) {
      res.status(400).json({ error: "Missing token" });
      return;
    }

    const [row] = await db
      .select({
        id: schema.users.id,
        emailVerified: schema.users.emailVerified,
        accountStatus: schema.users.accountStatus,
        verificationTokenExpiry: schema.users.verificationTokenExpiry,
      })
      .from(schema.users)
      .where(eq(schema.users.verificationToken, token))
      .limit(1);

    if (!row) {
      // Token invalid or already used — redirect with error flag
      res.redirect(`${APP_BASE}/discover?verified=invalid`);
      return;
    }

    if (row.emailVerified) {
      // Already verified — redirect based on current status
      const dest = row.accountStatus === "pending" ? `${APP_BASE}/pending?verified=already` : `${APP_BASE}/discover?verified=already`;
      res.redirect(dest);
      return;
    }

    // Check if token has expired (treat missing expiry as expired to be safe)
    const expiry = row.verificationTokenExpiry;
    if (!expiry || expiry.getTime() <= Date.now()) {
      const dest = row.accountStatus === "pending" ? `${APP_BASE}/pending?verified=expired` : `${APP_BASE}/login?verified=expired`;
      res.redirect(dest);
      return;
    }

    await db
      .update(schema.users)
      .set({ emailVerified: true, verificationToken: null, verificationTokenExpiry: null })
      .where(eq(schema.users.id, row.id));

    // Redirect to /pending for users awaiting approval, /discover for auto-approved
    if (row.accountStatus === "pending") {
      res.redirect(`${APP_BASE}/pending?verified=true`);
    } else {
      res.redirect(`${APP_BASE}/discover?verified=success`);
    }
  } catch (err) {
    req.log.error(err, "Verify email error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/resend-verification", authRateLimit, requireAuth, async (req, res) => {
  try {
    const [row] = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        emailVerified: schema.users.emailVerified,
      })
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .limit(1);

    if (!row) {
      res.status(404).json({ error: "Account not found" });
      return;
    }

    if (row.emailVerified) {
      res.status(400).json({ error: "Your email is already verified." });
      return;
    }

    const newToken = randomBytes(32).toString("hex");
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Setting a new token invalidates the old one (single column)
    await db
      .update(schema.users)
      .set({ verificationToken: newToken, verificationTokenExpiry: newExpiry })
      .where(eq(schema.users.id, row.id));

    const verificationLink = `${APP_BASE}/verify-email?token=${newToken}`;
    sendVerificationEmail(row.email, row.name, verificationLink).catch(
      (err) => req.log.warn(err, "Verification email failed to send"),
    );

    res.json({ message: "Verification email sent. Please check your inbox." });
  } catch (err) {
    req.log.error(err, "Resend verification error");
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
