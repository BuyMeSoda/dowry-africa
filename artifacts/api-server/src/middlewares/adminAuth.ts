import { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const secret = req.headers["x-admin-secret"] as string;
  const adminSecret = process.env["ADMIN_SECRET"];

  if (!adminSecret) {
    res.status(500).json({ error: "ADMIN_SECRET not configured" });
    return;
  }

  if (!secret || secret !== adminSecret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
