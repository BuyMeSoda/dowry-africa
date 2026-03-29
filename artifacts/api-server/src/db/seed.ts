import { v4 as uuidv4 } from "uuid";
import { db } from "./connection.js";
import * as schema from "./schema.js";

const DEMO_USERS = [
  {
    id: "demo-chidinma-0001-0000-000000000001",
    email: "chidinma@demo.com",
    passwordHash: "$demo$",
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
    completeness: 100,
    blocked: [] as string[],
  },
  {
    id: "demo-amara-00001-0000-000000000002",
    email: "amara@demo.com",
    passwordHash: "$demo$",
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
    completeness: 100,
    blocked: [] as string[],
  },
  {
    id: "demo-emeka-00001-0000-000000000003",
    email: "emeka@demo.com",
    passwordHash: "$demo$",
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
    completeness: 100,
    blocked: [] as string[],
  },
  {
    id: "demo-kofi-000001-0000-000000000004",
    email: "kofi@demo.com",
    passwordHash: "$demo$",
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
    completeness: 100,
    blocked: [] as string[],
  },
];

export async function seedDatabase(): Promise<void> {
  const chidinmaId = "demo-chidinma-0001-0000-000000000001";
  const amaraId = "demo-amara-00001-0000-000000000002";
  const emekaId = "demo-emeka-00001-0000-000000000003";
  const kofiId = "demo-kofi-000001-0000-000000000004";

  for (const user of DEMO_USERS) {
    await db.insert(schema.users).values(user).onConflictDoNothing();
  }

  const mutualLikes = [
    { fromId: chidinmaId, toId: kofiId },
    { fromId: kofiId, toId: chidinmaId },
    { fromId: amaraId, toId: emekaId },
    { fromId: emekaId, toId: amaraId },
    { fromId: amaraId, toId: kofiId },
    { fromId: kofiId, toId: amaraId },
  ];

  for (const like of mutualLikes) {
    await db.insert(schema.likes).values(like).onConflictDoNothing();
  }

  const starterMessages = [
    {
      id: "seed-msg-kofi-chidinma-001",
      fromId: kofiId,
      toId: chidinmaId,
      text: "Asalamu alaikum, Chidinma. Your profile really resonated with me — especially your view on marriage as a covenant. I'd love to hear more about you.",
      createdAt: new Date(Date.now() - 3_600_000),
    },
    {
      id: "seed-msg-emeka-amara-001",
      fromId: emekaId,
      toId: amaraId,
      text: "Hello Amara, fellow diaspora soul here. Navigating both worlds is its own journey — would love to connect.",
      createdAt: new Date(Date.now() - 7_200_000),
    },
  ];

  for (const msg of starterMessages) {
    await db.insert(schema.messages).values(msg).onConflictDoNothing();
  }
}
