import { pool } from "./connection.js";

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        gender TEXT NOT NULL,
        birth_year INTEGER NOT NULL,
        city TEXT,
        country TEXT,
        heritage TEXT[] NOT NULL DEFAULT '{}',
        faith TEXT,
        languages TEXT[] NOT NULL DEFAULT '{}',
        intent TEXT,
        life_stage TEXT,
        children_pref TEXT,
        marriage_timeline TEXT,
        family_involvement TEXT,
        relocation_open BOOLEAN,
        preferred_faith TEXT,
        preferred_country TEXT,
        preferred_heritage TEXT[],
        bio TEXT,
        quote TEXT,
        photo_url TEXT,
        tier TEXT NOT NULL DEFAULT 'free',
        has_badge BOOLEAN NOT NULL DEFAULT FALSE,
        stripe_customer_id TEXT,
        gender_pref TEXT,
        min_age INTEGER,
        max_age INTEGER,
        completeness INTEGER NOT NULL DEFAULT 0,
        last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        blocked TEXT[] NOT NULL DEFAULT '{}'
      );

      CREATE TABLE IF NOT EXISTS likes (
        from_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        to_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (from_id, to_id)
      );

      CREATE TABLE IF NOT EXISTS passes (
        from_id TEXT NOT NULL,
        to_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (from_id, to_id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        from_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        to_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active';

      CREATE TABLE IF NOT EXISTS waitlist (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        age INTEGER NOT NULL,
        city TEXT NOT NULL,
        country TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        intention TEXT NOT NULL,
        timeline TEXT NOT NULL,
        willing_profile BOOLEAN NOT NULL DEFAULT FALSE,
        willing_verify BOOLEAN NOT NULL DEFAULT FALSE,
        willing_respect BOOLEAN NOT NULL DEFAULT FALSE,
        faith TEXT,
        open_to_distance BOOLEAN,
        heritage TEXT,
        diaspora_preference TEXT,
        why_joining TEXT NOT NULL,
        referral_source TEXT,
        referral_code TEXT,
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        approved_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        reporter_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reported_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        details TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      INSERT INTO settings (key, value, updated_at)
      VALUES
        ('waitlist_mode', 'false', NOW()),
        ('maintenance_mode', 'false', NOW()),
        ('free_tier_daily_limit', '10', NOW()),
        ('announcement_banner', '', NOW())
      ON CONFLICT (key) DO NOTHING;
    `);
  } finally {
    client.release();
  }
}
