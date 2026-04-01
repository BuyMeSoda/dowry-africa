import { db } from "./connection.js";
import * as schema from "./schema.js";
import { sql } from "drizzle-orm";

// All demo user IDs — kept stable so messages/notifications stay linked
const DEMO_IDS = [
  "demo-chidinma-0001-0000-000000000001",
  "demo-amara-00001-0000-000000000002",
  "demo-emeka-00001-0000-000000000003",
  "demo-kofi-000001-0000-000000000004",
  "demo-seun-000001-0000-000000000005",
  "demo-kwame-00001-0000-000000000006",
  "demo-tobenna-0001-0000-000000000007",
  "demo-lekan-00001-0000-000000000008",
  "demo-zara-000001-0000-000000000009",
];

const DEMO_USERS = [
  // ── Women ──────────────────────────────────────────────────────────────────
  {
    id: "demo-chidinma-0001-0000-000000000001",
    email: "chidinma@demo.com",
    passwordHash: "$demo$",
    name: "Chidinma",
    gender: "woman",
    birthYear: 1996,
    city: "Lagos",
    country: "Nigeria",
    heritage: ["Nigeria"],
    faith: "Christianity",
    languages: ["English"],
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
    country: "United Kingdom",
    heritage: ["Ghana"],
    faith: "Christianity",
    languages: ["English", "French"],
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
    id: "demo-zara-000001-0000-000000000009",
    email: "zara@demo.com",
    passwordHash: "$demo$",
    name: "Zara",
    gender: "woman",
    birthYear: 1995,
    city: "Accra",
    country: "Ghana",
    heritage: ["Ghana"],
    faith: "Islam",
    languages: ["English", "French"],
    intent: "marriage_ready",
    lifeStage: "marriage_ready",
    childrenPref: "yes",
    marriageTimeline: "1_year",
    familyInvolvement: "high",
    bio: "Ghanaian Muslim woman who loves her faith and her culture in equal measure. Looking for a partner who is grounded, God-fearing, and growth-oriented.",
    quote: "Seek knowledge, then seek your people.",
    tier: "core",
    hasBadge: false,
    genderPref: "man",
    photoUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop",
    completeness: 100,
    blocked: [] as string[],
  },
  // ── Men ────────────────────────────────────────────────────────────────────
  {
    id: "demo-emeka-00001-0000-000000000003",
    email: "emeka@demo.com",
    passwordHash: "$demo$",
    name: "Emeka",
    gender: "man",
    birthYear: 1992,
    city: "Nairobi",
    country: "Kenya",
    heritage: ["Nigeria"],
    faith: "Islam",
    languages: ["English", "Swahili"],
    intent: "serious_relationship",
    lifeStage: "serious_relationship",
    childrenPref: "yes",
    marriageTimeline: "2_years",
    familyInvolvement: "high",
    bio: "Nigerian man building life in East Africa. I value family deeply — mine is loud, warm, and always at the table. Looking for someone who wants the same.",
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
    heritage: ["Ghana"],
    faith: "Christianity",
    languages: ["English", "French"],
    intent: "marriage_ready",
    lifeStage: "marriage_ready",
    childrenPref: "yes",
    marriageTimeline: "1_year",
    familyInvolvement: "medium",
    bio: "Ghanaian raised in South Africa. I carry the warmth of my roots into a modern, global life. Ready to build something real with the right person.",
    quote: "The strength of a tree is in its roots.",
    tier: "badge",
    hasBadge: true,
    genderPref: "woman",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    completeness: 100,
    blocked: [] as string[],
  },
  {
    id: "demo-seun-000001-0000-000000000005",
    email: "seun@demo.com",
    passwordHash: "$demo$",
    name: "Seun",
    gender: "man",
    birthYear: 1991,
    city: "Abuja",
    country: "Nigeria",
    heritage: ["Nigeria"],
    faith: "Christianity",
    languages: ["English"],
    intent: "marriage_ready",
    lifeStage: "marriage_ready",
    childrenPref: "yes",
    marriageTimeline: "1_year",
    familyInvolvement: "high",
    bio: "Abuja-based architect with a passion for building — homes, communities, and now, something lasting. I believe a marriage is the greatest project you'll ever lead.",
    quote: "Design your life with intention.",
    tier: "core",
    hasBadge: false,
    genderPref: "woman",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    completeness: 100,
    blocked: [] as string[],
  },
  {
    id: "demo-kwame-00001-0000-000000000006",
    email: "kwame@demo.com",
    passwordHash: "$demo$",
    name: "Kwame",
    gender: "man",
    birthYear: 1993,
    city: "Toronto",
    country: "Canada",
    heritage: ["Ghana"],
    faith: "Christianity",
    languages: ["English", "French"],
    intent: "marriage_ready",
    lifeStage: "marriage_ready",
    childrenPref: "yes",
    marriageTimeline: "2_years",
    familyInvolvement: "medium",
    bio: "Ghanaian-Canadian navigating diaspora life. Family man at heart — I cook Sunday jollof and call my mother every day. Looking for someone to share those traditions with.",
    quote: "Diaspora doesn't mean disconnected.",
    tier: "free",
    hasBadge: false,
    genderPref: "woman",
    photoUrl: "https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=400&h=400&fit=crop",
    completeness: 90,
    blocked: [] as string[],
  },
  {
    id: "demo-tobenna-0001-0000-000000000007",
    email: "tobenna@demo.com",
    passwordHash: "$demo$",
    name: "Tobenna",
    gender: "man",
    birthYear: 1990,
    city: "Houston",
    country: "United States",
    heritage: ["Nigeria"],
    faith: "Christianity",
    languages: ["English"],
    intent: "marriage_ready",
    lifeStage: "marriage_ready",
    childrenPref: "yes",
    marriageTimeline: "asap",
    familyInvolvement: "high",
    bio: "Nigerian-American doctor who still gets Mum's soup on his birthday. I want a partner who values both our heritage and our future together.",
    quote: "Character is the foundation everything else is built on.",
    tier: "badge",
    hasBadge: true,
    genderPref: "woman",
    photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop",
    completeness: 100,
    blocked: [] as string[],
  },
  {
    id: "demo-lekan-00001-0000-000000000008",
    email: "lekan@demo.com",
    passwordHash: "$demo$",
    name: "Lekan",
    gender: "man",
    birthYear: 1995,
    city: "Manchester",
    country: "United Kingdom",
    heritage: ["Nigeria"],
    faith: "Islam",
    languages: ["English"],
    intent: "serious_relationship",
    lifeStage: "serious_relationship",
    childrenPref: "open",
    marriageTimeline: "2_years",
    familyInvolvement: "medium",
    bio: "British-Nigerian creative director. I love our culture's storytelling tradition — in work and in life. Looking for someone curious, grounded, and ready to grow.",
    quote: "Every great story begins with two people who chose each other.",
    tier: "core",
    hasBadge: false,
    genderPref: "woman",
    photoUrl: "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop",
    completeness: 95,
    blocked: [] as string[],
  },
];

export async function seedDatabase(): Promise<void> {
  // ── 1. Upsert demo users — update mutable fields so re-seeds pick up changes ──
  for (const user of DEMO_USERS) {
    await db.insert(schema.users).values(user).onConflictDoUpdate({
      target: schema.users.id,
      set: {
        heritage: user.heritage,
        languages: user.languages,
        bio: user.bio,
        quote: user.quote,
        photoUrl: user.photoUrl,
        completeness: user.completeness,
        tier: user.tier,
        hasBadge: user.hasBadge,
      },
    });
  }

  // ── 2. Reset all likes/passes among demo users so the feed is always fresh
  //    This undoes any likes that automated tests or demo sessions created.
  const idList = DEMO_IDS.map(id => `'${id}'`).join(", ");
  await db.execute(sql.raw(`DELETE FROM likes  WHERE from_id IN (${idList})`));
  await db.execute(sql.raw(`DELETE FROM passes WHERE from_id IN (${idList})`));

  // ── 3. Seed only the intended starter mutual matches ────────────────────
  const chidinmaId = "demo-chidinma-0001-0000-000000000001";
  const kofiId     = "demo-kofi-000001-0000-000000000004";
  const amaraId    = "demo-amara-00001-0000-000000000002";
  const emekaId    = "demo-emeka-00001-0000-000000000003";

  // Chidinma ↔ Kofi and Amara ↔ Emeka are pre-matched for the messaging demo
  const starterLikes = [
    { fromId: chidinmaId, toId: kofiId },
    { fromId: kofiId, toId: chidinmaId },
    { fromId: amaraId, toId: emekaId },
    { fromId: emekaId, toId: amaraId },
  ];
  for (const like of starterLikes) {
    await db.insert(schema.likes).values(like).onConflictDoNothing();
  }

  // ── 4. Seed starter conversation messages ──────────────────────────────
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

  // ── 5. Seed message prompts ─────────────────────────────────────────────
  const defaultPrompts = [
    { promptText: "What traditions do you want to carry into your marriage?", displayOrder: 1 },
    { promptText: "How do you stay connected to your roots while living abroad?", displayOrder: 2 },
    { promptText: "What role does faith play in your daily life?", displayOrder: 3 },
    { promptText: "What does family mean to you?", displayOrder: 4 },
    { promptText: "What are you most excited about in your next chapter of life?", displayOrder: 5 },
    { promptText: "How do you handle conflict in relationships?", displayOrder: 6 },
    { promptText: "What values are non-negotiable for you in a partner?", displayOrder: 7 },
    { promptText: "What does a typical Sunday look like for you?", displayOrder: 8 },
    { promptText: "How important is it for your partner to speak your language?", displayOrder: 9 },
    { promptText: "What's your vision of marriage in 5 years?", displayOrder: 10 },
  ];
  // Only insert if the table is empty — avoids duplicating user-managed prompts
  const existingCount = await db.select({ count: sql<number>`count(*)::int` }).from(schema.messagePrompts);
  if ((existingCount[0]?.count ?? 0) === 0) {
    await db.insert(schema.messagePrompts).values(defaultPrompts);
  }
}
