import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { users } from "../db/database.js";

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
    if (!users.has(payload.userId)) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
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
    if (users.has(payload.userId)) req.userId = payload.userId;
  } catch {}
  next();
}
