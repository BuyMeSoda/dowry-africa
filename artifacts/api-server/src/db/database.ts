import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

export type Tier = "free" | "core" | "badge";

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  gender: "man" | "woman" | "non-binary";
  birthYear: number;
  age: number;
  city?: string;
  country?: string;
  heritage: string[];
  faith?: string;
  languages: string[];
  intent?: string;
  lifeStage?: string;
  childrenPref?: string;
  marriageTimeline?: string;
  familyInvolvement?: string;
  relocationOpen?: boolean;
  bio?: string;
  quote?: string;
  photoUrl?: string;
  tier: Tier;
  hasBadge: boolean;
  genderPref?: string;
  minAge?: number;
  maxAge?: number;
  completeness: number;
  lastActive: Date;
  createdAt: Date;
  blocked: string[];
}

export interface Like {
  fromId: string;
  toId: string;
  createdAt: Date;
}

export interface Pass {
  fromId: string;
  toId: string;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  text: string;
  createdAt: Date;
}

export const users = new Map<string, User>();
export const likes = new Map<string, Like>();
export const passes = new Map<string, Pass>();
export const messages: Message[] = [];

function calcCompleteness(u: Partial<User>): number {
  const fields = [u.bio, u.quote, u.photoUrl, u.city, u.country, u.faith, u.intent, u.lifeStage, u.childrenPref, u.marriageTimeline];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

async function seedUser(data: {
  email: string;
  password: string;
  name: string;
  gender: "man" | "woman" | "non-binary";
  birthYear: number;
  city: string;
  country: string;
  heritage: string[];
  faith: string;
  languages: string[];
  intent: string;
  lifeStage: string;
  childrenPref: string;
  marriageTimeline: string;
  familyInvolvement: string;
  bio: string;
  quote: string;
  tier: Tier;
  hasBadge: boolean;
  genderPref: string;
  photoUrl?: string;
}) {
  const id = uuidv4();
  const passwordHash = data.password === "demo" ? "$demo$" : await bcrypt.hash(data.password, 12);
  const now = new Date();
  const user: User = {
    id,
    email: data.email,
    passwordHash,
    name: data.name,
    gender: data.gender,
    birthYear: data.birthYear,
    age: new Date().getFullYear() - data.birthYear,
    city: data.city,
    country: data.country,
    heritage: data.heritage,
    faith: data.faith,
    languages: data.languages,
    intent: data.intent,
    lifeStage: data.lifeStage,
    childrenPref: data.childrenPref,
    marriageTimeline: data.marriageTimeline,
    familyInvolvement: data.familyInvolvement,
    bio: data.bio,
    quote: data.quote,
    photoUrl: data.photoUrl,
    tier: data.tier,
    hasBadge: data.hasBadge,
    genderPref: data.genderPref,
    minAge: 24,
    maxAge: 45,
    completeness: 100,
    lastActive: now,
    createdAt: now,
    blocked: [],
  };
  user.completeness = calcCompleteness(user);
  users.set(id, user);
  return user;
}

export async function seedDatabase() {
  const chidinma = await seedUser({
    email: "chidinma@demo.com",
    password: "demo",
    name: "Chidinma",
    gender: "woman",
    birthYear: 1996,
    city: "Lagos",
    country: "Nigeria",
    heritage: ["Igbo"],
    faith: "Christian",
    languages: ["English", "Igbo"],
    intent: "marriage_ready",
    lifeStage: "marriage_ready",
    childrenPref: "yes",
    marriageTimeline: "1_year",
    familyInvolvement: "high",
    bio: "I believe marriage is a sacred covenant, not just a social contract. I'm looking for someone who leads with intention and loves with depth.",
    quote: "The best time to plant a tree was 20 years ago. The second best time is now.",
    tier: "badge",
    hasBadge: true,
    genderPref: "man",
    photoUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop",
  });

  const amara = await seedUser({
    email: "amara@demo.com",
    password: "demo",
    name: "Amara",
    gender: "woman",
    birthYear: 1998,
    city: "London",
    country: "UK",
    heritage: ["Akan"],
    faith: "Christian",
    languages: ["English", "Twi"],
    intent: "marriage_ready",
    lifeStage: "marriage_ready",
    childrenPref: "yes",
    marriageTimeline: "2_years",
    familyInvolvement: "medium",
    bio: "Ghanaian-British. I'm deeply rooted in my culture while navigating life in the diaspora. Looking for someone who understands both worlds.",
    quote: "Home is wherever my people are.",
    tier: "badge",
    hasBadge: true,
    genderPref: "man",
    photoUrl: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop",
  });

  const emeka = await seedUser({
    email: "emeka@demo.com",
    password: "demo",
    name: "Emeka",
    gender: "man",
    birthYear: 1992,
    city: "Nairobi",
    country: "Kenya",
    heritage: ["Yoruba"],
    faith: "Muslim",
    languages: ["English", "Yoruba", "Swahili"],
    intent: "serious_relationship",
    lifeStage: "serious_relationship",
    childrenPref: "yes",
    marriageTimeline: "2_years",
    familyInvolvement: "high",
    bio: "Yoruba man building life in East Africa. I value family deeply — mine is loud, warm, and always at the table. Looking for someone who wants the same.",
    quote: "A family that prays together stays together.",
    tier: "core",
    hasBadge: false,
    genderPref: "woman",
    photoUrl: "https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&h=400&fit=crop",
  });

  const kofi = await seedUser({
    email: "kofi@demo.com",
    password: "demo",
    name: "Kofi",
    gender: "man",
    birthYear: 1994,
    city: "Johannesburg",
    country: "South Africa",
    heritage: ["Akan"],
    faith: "Christian",
    languages: ["English", "Twi"],
    intent: "marriage_ready",
    lifeStage: "marriage_ready",
    childrenPref: "yes",
    marriageTimeline: "1_year",
    familyInvolvement: "medium",
    bio: "Ghanaian raised in South Africa. I bring together the warmth of Akan traditions with a modern, global perspective. Ready to build something real.",
    quote: "The strength of a tree is in its roots.",
    tier: "badge",
    hasBadge: true,
    genderPref: "woman",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
  });

  return { chidinma, amara, emeka, kofi };
}

export function getUserByEmail(email: string): User | undefined {
  for (const user of users.values()) {
    if (user.email.toLowerCase() === email.toLowerCase()) return user;
  }
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
  };
}

export function getLikesKey(fromId: string, toId: string) {
  return `${fromId}:${toId}`;
}

export function updateUserCompleteness(user: User) {
  const fields = [user.bio, user.quote, user.photoUrl, user.city, user.country, user.faith, user.intent, user.lifeStage, user.childrenPref, user.marriageTimeline];
  const filled = fields.filter(Boolean).length;
  user.completeness = Math.round((filled / fields.length) * 100);
}
