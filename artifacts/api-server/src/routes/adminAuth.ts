import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import rateLimit from "express-rate-limit";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";
import { requireAdmin } from "../middlewares/adminAuth.js";
import { sendAdminWelcomeEmail, sendAdminPasswordResetEmail } from "../lib/email.js";

const router = Router();

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in 15 minutes." },
});

function makeAdminToken(adminId: string, email: string, role: string) {
  const secret = process.env["JWT_SECRET"]!;
  return jwt.sign({ adminId, email, role, type: "admin" }, secret, { expiresIn: "24h" });
}

function sanitizeAdmin(a: typeof schema.adminUsers.$inferSelect) {
  return {
    id: a.id,
    email: a.email,
    name: a.name,
    role: a.role,
    isActive: a.isActive,
    lastLogin: a.lastLogin,
    createdAt: a.createdAt,
  };
}

// POST /api/admin-auth/login
router.post("/login", authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    const [admin] = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.email, email.toLowerCase().trim()))
      .limit(1);

    if (!admin || !admin.isActive) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    await db
      .update(schema.adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(schema.adminUsers.id, admin.id));

    const token = makeAdminToken(admin.id, admin.email, admin.role);
    res.json({ token, admin: sanitizeAdmin(admin) });
  } catch (err) {
    req.log.error(err, "Admin login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin-auth/me
router.get("/me", requireAdmin, async (req, res) => {
  try {
    const [admin] = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.id, req.adminId!))
      .limit(1);

    if (!admin) {
      res.status(404).json({ error: "Admin not found" });
      return;
    }

    res.json(sanitizeAdmin(admin));
  } catch (err) {
    req.log.error(err, "Admin me error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin-auth/forgot-password
router.post("/forgot-password", authRateLimit, async (req, res) => {
  try {
    const { email } = req.body;
    const successMsg = { message: "If this email has admin access, a reset link will be sent." };

    if (!email) { res.json(successMsg); return; }

    const [admin] = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.email, email.toLowerCase().trim()))
      .limit(1);

    if (!admin) { res.json(successMsg); return; }

    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await db
      .update(schema.adminUsers)
      .set({ resetToken, resetTokenExpiry })
      .where(eq(schema.adminUsers.id, admin.id));

    const frontendUrl = process.env["FRONTEND_URL"] ?? "https://dowry.africa";
    const resetLink = `${frontendUrl}/admin/reset-password?token=${resetToken}`;

    sendAdminPasswordResetEmail(admin.email, admin.name, resetLink).catch(
      (err) => req.log.warn(err, "Admin reset email failed"),
    );

    res.json(successMsg);
  } catch (err) {
    req.log.error(err, "Admin forgot password error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin-auth/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ error: "Token and new password required" });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters" });
      return;
    }

    const [admin] = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.resetToken, token))
      .limit(1);

    if (!admin || !admin.resetTokenExpiry || admin.resetTokenExpiry < new Date()) {
      res.status(400).json({ error: "This link is invalid or has expired." });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db
      .update(schema.adminUsers)
      .set({ passwordHash, resetToken: null, resetTokenExpiry: null })
      .where(eq(schema.adminUsers.id, admin.id));

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    req.log.error(err, "Admin reset password error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Admin User Management (super_admin only) ────────────────────────────────

// GET /api/admin-auth/admins
router.get("/admins", requireAdmin, async (req, res) => {
  try {
    if (req.adminRole !== "super_admin") {
      res.status(403).json({ error: "Super admin access required" });
      return;
    }
    const admins = await db
      .select()
      .from(schema.adminUsers)
      .orderBy(schema.adminUsers.createdAt);

    res.json(admins.map(sanitizeAdmin));
  } catch (err) {
    req.log.error(err, "List admins error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin-auth/admins
router.post("/admins", requireAdmin, async (req, res) => {
  try {
    if (req.adminRole !== "super_admin") {
      res.status(403).json({ error: "Super admin access required" });
      return;
    }
    const { name, email, tempPassword } = req.body;
    if (!name || !email || !tempPassword) {
      res.status(400).json({ error: "Name, email, and temporary password required" });
      return;
    }

    const existing = await db
      .select({ id: schema.adminUsers.id })
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing.length > 0) {
      res.status(400).json({ error: "An admin with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const id = uuidv4();

    await db.insert(schema.adminUsers).values({
      id,
      email: email.toLowerCase().trim(),
      passwordHash,
      name,
      role: "admin",
      isActive: true,
      createdAt: new Date(),
    });

    const [newAdmin] = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.id, id))
      .limit(1);

    const frontendUrl = process.env["FRONTEND_URL"] ?? "https://dowry.africa";
    const loginUrl = `${frontendUrl}/admin/login`;
    sendAdminWelcomeEmail(email.toLowerCase().trim(), name, tempPassword, loginUrl).catch(
      (err) => req.log.warn(err, "Admin welcome email failed"),
    );

    res.status(201).json(sanitizeAdmin(newAdmin));
  } catch (err) {
    req.log.error(err, "Create admin error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin-auth/admins/:id
router.patch("/admins/:id", requireAdmin, async (req, res) => {
  try {
    if (req.adminRole !== "super_admin") {
      res.status(403).json({ error: "Super admin access required" });
      return;
    }

    const { id } = req.params;
    const { isActive, resetPassword } = req.body;

    const [target] = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.id, id))
      .limit(1);

    if (!target) {
      res.status(404).json({ error: "Admin not found" });
      return;
    }

    if (target.role === "super_admin") {
      res.status(400).json({ error: "Super admin account cannot be modified" });
      return;
    }

    const updates: Partial<typeof schema.adminUsers.$inferInsert> = {};

    if (typeof isActive === "boolean") updates.isActive = isActive;

    if (resetPassword) {
      const resetToken = randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
      updates.resetToken = resetToken;
      updates.resetTokenExpiry = resetTokenExpiry;

      const frontendUrl = process.env["FRONTEND_URL"] ?? "https://dowry.africa";
      const resetLink = `${frontendUrl}/admin/reset-password?token=${resetToken}`;
      sendAdminPasswordResetEmail(target.email, target.name, resetLink).catch(
        (err) => req.log.warn(err, "Admin reset email failed"),
      );
    }

    await db.update(schema.adminUsers).set(updates).where(eq(schema.adminUsers.id, id));
    const [updated] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.id, id)).limit(1);
    res.json(sanitizeAdmin(updated));
  } catch (err) {
    req.log.error(err, "Update admin error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin-auth/admins/:id
router.delete("/admins/:id", requireAdmin, async (req, res) => {
  try {
    if (req.adminRole !== "super_admin") {
      res.status(403).json({ error: "Super admin access required" });
      return;
    }

    const { id } = req.params;

    const [target] = await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.id, id))
      .limit(1);

    if (!target) {
      res.status(404).json({ error: "Admin not found" });
      return;
    }

    if (target.role === "super_admin") {
      res.status(400).json({ error: "Super admin account cannot be deleted" });
      return;
    }

    await db.delete(schema.adminUsers).where(eq(schema.adminUsers.id, id));
    res.json({ message: "Admin removed" });
  } catch (err) {
    req.log.error(err, "Delete admin error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
