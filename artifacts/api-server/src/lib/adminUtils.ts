import { eq, and } from "drizzle-orm";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";

export async function isAdminEmail(email: string): Promise<boolean> {
  const row = await db
    .select({ id: schema.adminUsers.id })
    .from(schema.adminUsers)
    .where(and(eq(schema.adminUsers.email, email), eq(schema.adminUsers.isActive, true)))
    .limit(1);
  return row.length > 0;
}

export function applyAdminOverride<T extends { tier?: string; hasBadge?: boolean; accountStatus?: string }>(user: T): T {
  return {
    ...user,
    tier: "badge",
    hasBadge: true,
    accountStatus: "approved",
  };
}
