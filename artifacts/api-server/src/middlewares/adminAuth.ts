import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      adminId?: string;
      adminRole?: string;
      adminEmail?: string;
    }
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"] as string | undefined;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env["JWT_SECRET"];

  if (!secret) {
    res.status(500).json({ error: "Server misconfigured" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as {
      adminId: string;
      role: string;
      email: string;
      type: string;
    };

    if (payload.type !== "admin") {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    req.adminId = payload.adminId;
    req.adminRole = payload.role;
    req.adminEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ error: "Session expired. Please sign in again." });
  }
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  requireAdmin(req, res, () => {
    if (req.adminRole !== "super_admin") {
      res.status(403).json({ error: "Super admin access required" });
      return;
    }
    next();
  });
}
