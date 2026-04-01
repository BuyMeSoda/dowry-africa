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
  preferredFaiths: text("preferred_faiths").array().notNull().default(sql`ARRAY[]::text[]`),
  preferredCountry: text("preferred_country"),
  preferredHeritage: text("preferred_heritage").array(),
  preferredResidence: text("preferred_residence").array(),
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

export const earlyAccess = pgTable("early_access", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const customValues = pgTable("custom_values", {
  id: text("id").primaryKey(),
  fieldType: text("field_type").notNull(), // 'heritage' | 'faith' | 'other'
  displayValue: text("display_value").notNull(),
  normalizedValue: text("normalized_value").notNull(),
  usageCount: integer("usage_count").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'like' | 'match' | 'message'
  fromUserId: text("from_user_id").references(() => users.id, { onDelete: "cascade" }),
  seen: boolean("seen").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const blocks = pgTable("blocks", {
  blockerUserId: text("blocker_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  blockedUserId: text("blocked_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.blockerUserId, t.blockedUserId] })]);

export const messagePrompts = pgTable("message_prompts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  promptText: text("prompt_text").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
