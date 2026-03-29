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
    `);
  } finally {
    client.release();
  }
}
