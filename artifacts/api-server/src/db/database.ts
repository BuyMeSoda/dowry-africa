import type { InferSelectModel } from "drizzle-orm";
import type { users as usersTable } from "./schema.js";

export type Tier = "free" | "core" | "badge";

export type DbUser = InferSelectModel<typeof usersTable>;

export type User = DbUser & { age: number };

export function toUser(row: DbUser): User {
  return {
    ...row,
    age: new Date().getFullYear() - row.birthYear,
  };
}

export function sanitizeUser(user: User): Omit<User, "passwordHash" | "blocked"> {
  const { passwordHash, blocked, ...safe } = user;
  return safe;
}

export function publicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    age: user.age,
    city: user.city,
    country: user.country,
    heritage: user.heritage,
    faith: user.faith,
    languages: user.languages,
    intent: user.intent,
    lifeStage: user.lifeStage,
    bio: user.bio,
    quote: user.quote,
    photoUrl: user.photoUrl,
    hasBadge: user.hasBadge,
    tier: user.tier,
    childrenPref: user.childrenPref,
    marriageTimeline: user.marriageTimeline,
    familyInvolvement: user.familyInvolvement,
  };
}

export function calcCompleteness(u: Partial<User>): number {
  const fields = [u.bio, u.quote, u.photoUrl, u.city, u.country, u.faith, u.intent, u.lifeStage, u.childrenPref, u.marriageTimeline];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

export function getLikesKey(fromId: string, toId: string) {
  return `${fromId}:${toId}`;
}
