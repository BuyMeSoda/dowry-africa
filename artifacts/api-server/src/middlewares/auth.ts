import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";

export interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env["JWT_SECRET"];
  if (!secret) {
    res.status(500).json({ error: "JWT_SECRET not configured" });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export async function requireApproved(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const [row] = await db
      .select({ accountStatus: schema.users.accountStatus })
      .from(schema.users)
      .where(eq(schema.users.id, req.userId))
      .limit(1);

    if (!row) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (row.accountStatus !== "approved") {
      res.status(403).json({ error: "Account pending approval" });
      return;
    }
    next();
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }
  const token = authHeader.slice(7);
  const secret = process.env["JWT_SECRET"];
  if (!secret) { next(); return; }
  try {
    const payload = jwt.verify(token, secret) as JwtPayload;
    req.userId = payload.userId;
  } catch {}
  next();
}
