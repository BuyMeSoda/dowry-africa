import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { eq, or } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";
import { toUser, calcCompleteness } from "../db/database.js";
import type { User } from "../db/database.js";

const IS_PRODUCTION = process.env["NODE_ENV"] === "production";

const CALLBACK_URL = IS_PRODUCTION
  ? "https://workspaceapi-server-production-bb0e.up.railway.app/api/auth/google/callback"
  : "http://localhost:5000/api/auth/google/callback";

const clientID = process.env["GOOGLE_CLIENT_ID"];
const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];

if (clientID && clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value?.toLowerCase() ?? null;
          const name = profile.displayName || email || "New Member";
          const photoUrl = profile.photos?.[0]?.value ?? null;

          // Build OR conditions: always match by googleId, optionally by email
          const conditions = [eq(schema.users.googleId, googleId)];
          if (email) conditions.push(eq(schema.users.email, email));

          const [existing] = await db
            .select()
            .from(schema.users)
            .where(or(...conditions))
            .limit(1);

          if (existing) {
            const updates: Partial<typeof schema.users.$inferInsert> = {
              lastActive: new Date(),
            };
            // Link googleId if the account was found by email and isn't linked yet
            if (!existing.googleId) updates.googleId = googleId;
            // Update photo from Google if none set locally
            if (!existing.photoUrl && photoUrl) updates.photoUrl = photoUrl;

            await db
              .update(schema.users)
              .set(updates)
              .where(eq(schema.users.id, existing.id));

            return done(null, toUser({ ...existing, ...updates }) as User);
          }

          // No account found — create a new one
          if (!email) {
            return done(new Error("Google account did not return an email address"), undefined);
          }

          const id = uuidv4();
          const now = new Date();
          const completeness = calcCompleteness({});

          await db.insert(schema.users).values({
            id,
            email,
            passwordHash: "$oauth_google$",
            name,
            gender: "unknown",
            birthYear: new Date().getFullYear() - 25,
            googleId,
            photoUrl,
            heritage: [],
            languages: [],
            tier: "free",
            hasBadge: false,
            completeness,
            lastActive: now,
            createdAt: now,
            blocked: [],
          });

          const [row] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, id))
            .limit(1);

          return done(null, toUser(row) as User);
        } catch (err) {
          return done(err as Error, undefined);
        }
      },
    ),
  );
}

// ── Serialize: store only the user's DB id in the session ────────────────────
passport.serializeUser((user, done) => {
  done(null, (user as User).id);
});

// ── Deserialize: load the full user from DB on every request ─────────────────
passport.deserializeUser(async (id: unknown, done) => {
  try {
    const [row] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, id as string))
      .limit(1);

    if (!row) return done(null, false);
    done(null, toUser(row));
  } catch (err) {
    done(err, null);
  }
});

export default passport;
