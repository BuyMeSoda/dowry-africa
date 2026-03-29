import { pgTable, text, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
export { sql };

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  gender: text("gender").notNull(),
  birthYear: integer("birth_year").notNull(),
  city: text("city"),
  country: text("country"),
  heritage: text("heritage").array().notNull().default(sql`ARRAY[]::text[]`),
  faith: text("faith"),
  languages: text("languages").array().notNull().default(sql`ARRAY[]::text[]`),
  intent: text("intent"),
  lifeStage: text("life_stage"),
  childrenPref: text("children_pref"),
  marriageTimeline: text("marriage_timeline"),
  familyInvolvement: text("family_involvement"),
  relocationOpen: boolean("relocation_open"),
  preferredFaith: text("preferred_faith"),
  preferredCountry: text("preferred_country"),
  preferredHeritage: text("preferred_heritage").array(),
  bio: text("bio"),
  quote: text("quote"),
  photoUrl: text("photo_url"),
  tier: text("tier").notNull().default("free"),
  hasBadge: boolean("has_badge").notNull().default(false),
  stripeCustomerId: text("stripe_customer_id"),
  genderPref: text("gender_pref"),
  minAge: integer("min_age"),
  maxAge: integer("max_age"),
  completeness: integer("completeness").notNull().default(0),
  lastActive: timestamp("last_active", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  blocked: text("blocked").array().notNull().default(sql`ARRAY[]::text[]`),
  accountStatus: text("account_status").notNull().default("active"),
});

export const waitlist = pgTable("waitlist", {
  id: text("id").primaryKey(),
  fullName: text("full_name").notNull(),
  age: integer("age").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  email: text("email").notNull().unique(),
  intention: text("intention").notNull(),
  timeline: text("timeline").notNull(),
  willingProfile: boolean("willing_profile").notNull().default(false),
  willingVerify: boolean("willing_verify").notNull().default(false),
  willingRespect: boolean("willing_respect").notNull().default(false),
  faith: text("faith"),
  openToDistance: boolean("open_to_distance"),
  heritage: text("heritage"),
  diasporaPreference: text("diaspora_preference"),
  whyJoining: text("why_joining").notNull(),
  referralSource: text("referral_source"),
  referralCode: text("referral_code"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  reporterUserId: text("reporter_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reportedUserId: text("reported_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  details: text("details"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const likes = pgTable("likes", {
  fromId: text("from_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toId: text("to_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.fromId, t.toId] })]);

export const passes = pgTable("passes", {
  fromId: text("from_id").notNull(),
  toId: text("to_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.fromId, t.toId] })]);

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  fromId: text("from_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toId: text("to_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
