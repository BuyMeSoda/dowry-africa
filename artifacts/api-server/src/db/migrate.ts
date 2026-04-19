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

      CREATE TABLE IF NOT EXISTS early_access (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
        ('coming_soon_mode', 'false', NOW()),
        ('coming_soon_headline', 'Built for marriage. Not just matches.', NOW()),
        ('coming_soon_subtext', 'Dowry.Africa is launching soon — a curated platform for Africans and the diaspora who are serious about commitment. No games. No talking stages. Just real people ready for real love.', NOW()),
        ('coming_soon_exclusivity', 'We are onboarding a limited number of serious members. Be first.', NOW()),
        ('coming_soon_button_text', 'Request early access', NOW()),
        ('coming_soon_success_message', 'You''re on the list. We''ll be in touch soon.', NOW()),
        ('free_tier_daily_limit', '10', NOW()),
        ('announcement_banner', '', NOW())
      ON CONFLICT (key) DO NOTHING;

      DROP TABLE IF EXISTS waitlist;

      ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        from_user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        seen BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS notifications_user_unseen ON notifications (user_id, seen) WHERE seen = false;

      ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_faiths TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

      CREATE TABLE IF NOT EXISTS custom_values (
        id TEXT PRIMARY KEY,
        field_type TEXT NOT NULL,
        display_value TEXT NOT NULL,
        normalized_value TEXT NOT NULL,
        usage_count INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(field_type, display_value)
      );

      CREATE INDEX IF NOT EXISTS custom_values_field_prefix ON custom_values (field_type, display_value);

      CREATE TABLE IF NOT EXISTS blocks (
        blocker_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        blocked_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (blocker_user_id, blocked_user_id)
      );

      CREATE INDEX IF NOT EXISTS blocks_blocker ON blocks (blocker_user_id);
      CREATE INDEX IF NOT EXISTS blocks_blocked ON blocks (blocked_user_id);

      ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_residence TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

      CREATE TABLE IF NOT EXISTS message_prompts (
        id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        prompt_text TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      INSERT INTO message_prompts (prompt_text, is_active, display_order)
      SELECT * FROM (VALUES
        ('What traditions do you want to carry into your marriage?', TRUE, 1),
        ('How do you stay connected to your roots while living abroad?', TRUE, 2),
        ('What role does faith play in your daily life?', TRUE, 3),
        ('What does family mean to you?', TRUE, 4),
        ('What are you most excited about in your next chapter of life?', TRUE, 5),
        ('How do you handle conflict in relationships?', TRUE, 6),
        ('What values are non-negotiable for you in a partner?', TRUE, 7),
        ('What does a typical Sunday look like for you?', TRUE, 8),
        ('How important is it for your partner to speak your language?', TRUE, 9),
        ('What''s your vision of marriage in 5 years?', TRUE, 10)
      ) AS v(prompt_text, is_active, display_order)
      WHERE NOT EXISTS (SELECT 1 FROM message_prompts LIMIT 1);

      -- Email verification columns (added after initial schema)
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expiry TIMESTAMPTZ;
      -- Backfill expiry for any existing users that have a token but no expiry
      UPDATE users
        SET verification_token_expiry = NOW() + INTERVAL '7 days'
        WHERE verification_token IS NOT NULL AND verification_token_expiry IS NULL;

      -- Email templates (saved broadcast templates)
      CREATE TABLE IF NOT EXISTS email_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        cta_label TEXT,
        cta_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Password reset columns
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ;

      -- Unsubscribe columns
      ALTER TABLE users ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;
      ALTER TABLE early_access ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;

      -- Admin users table
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_login TIMESTAMPTZ,
        reset_token TEXT,
        reset_token_expiry TIMESTAMPTZ
      );

      -- Broadcast logs (history of sent broadcasts)
      CREATE TABLE IF NOT EXISTS broadcast_logs (
        id TEXT PRIMARY KEY,
        subject TEXT NOT NULL,
        body TEXT NOT NULL,
        recipient_group TEXT NOT NULL,
        recipient_count INTEGER NOT NULL DEFAULT 0,
        sent_count INTEGER NOT NULL DEFAULT 0,
        failed_count INTEGER NOT NULL DEFAULT 0,
        sent_by TEXT NOT NULL DEFAULT 'admin',
        status TEXT NOT NULL DEFAULT 'sent',
        cta_label TEXT,
        cta_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Gated approval system columns
      ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

      -- Migrate existing 'active' users to 'approved' so they are not affected
      UPDATE users SET account_status = 'approved' WHERE account_status = 'active';

      -- Manual approval setting (default ON = all new registrations need admin approval)
      INSERT INTO settings (key, value, updated_at)
      VALUES ('manual_approval_required', 'true', NOW())
      ON CONFLICT (key) DO NOTHING;

      -- Update exclusivity line copy
      UPDATE settings
      SET value = 'Join 100s of Africans already on the waitlist', updated_at = NOW()
      WHERE key = 'coming_soon_exclusivity'
        AND value IN ('We are onboarding a limited number of serious members. Be first.', '');
    `);
  } finally {
    client.release();
  }
}
