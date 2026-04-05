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
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry", { withTimezone: true }),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
});

export const adminUsers = pgTable("admin_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("admin"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLogin: timestamp("last_login", { withTimezone: true }),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry", { withTimezone: true }),
});

export const earlyAccess = pgTable("early_access", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
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

export const emailTemplates = pgTable("email_templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  ctaLabel: text("cta_label"),
  ctaUrl: text("cta_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const broadcastLogs = pgTable("broadcast_logs", {
  id: text("id").primaryKey(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  recipientGroup: text("recipient_group").notNull(),
  recipientCount: integer("recipient_count").notNull().default(0),
  sentCount: integer("sent_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  sentBy: text("sent_by").notNull().default("admin"),
  status: text("status").notNull().default("sent"),
  ctaLabel: text("cta_label"),
  ctaUrl: text("cta_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
