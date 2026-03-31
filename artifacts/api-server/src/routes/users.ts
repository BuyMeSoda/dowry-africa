import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import multer from "multer";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";
import { toUser, sanitizeUser, publicUser, calcCompleteness } from "../db/database.js";
import { requireAuth } from "../middlewares/auth.js";
import { cloudinary, cloudinaryEnabled } from "../lib/cloudinary.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

const router = Router();

const ALLOWED_FIELDS = [
  "city", "country", "heritage", "faith", "languages",
  "intent", "lifeStage", "childrenPref", "marriageTimeline",
  "familyInvolvement", "relocationOpen", "bio", "quote", "photoUrl",
  "genderPref", "minAge", "maxAge",
  "preferredFaith", "preferredFaiths", "preferredCountry", "preferredHeritage",
] as const;

router.get("/me/profile", requireAuth, async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .limit(1);

    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json(sanitizeUser(toUser(row)));
  } catch (err) {
    req.log.error(err, "Get profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/me/profile", requireAuth, async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .limit(1);

    if (!row) { res.status(404).json({ error: "Not found" }); return; }

    const updates: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in req.body) {
        updates[key] = req.body[key];
      }
    }

    const merged = { ...toUser(row), ...updates };
    updates["completeness"] = calcCompleteness(merged);
    updates["lastActive"] = new Date();

    await db
      .update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, req.userId!));

    const [updated] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .limit(1);

    res.json(sanitizeUser(toUser(updated)));
  } catch (err) {
    req.log.error(err, "Update profile error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/me/photo", requireAuth, (req, res, next) => {
  upload.single("photo")(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message ?? "Invalid file" });
      return;
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }

    if (!cloudinaryEnabled) {
      res.status(503).json({ error: "Photo uploads are not configured on this server. Please contact support." });
      return;
    }

    const buffer = req.file.buffer;

    const secureUrl = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "dowry-africa/profiles",
          resource_type: "image",
          format: "webp",
          transformation: [{ width: 800, height: 1000, crop: "limit", quality: "auto" }],
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error("Upload failed"));
          resolve(result.secure_url);
        },
      );
      stream.end(buffer);
    });

    const completenessBase = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!))
      .limit(1);

    if (!completenessBase[0]) { res.status(404).json({ error: "User not found" }); return; }

    const merged = { ...toUser(completenessBase[0]), photoUrl: secureUrl };

    await db
      .update(schema.users)
      .set({ photoUrl: secureUrl, completeness: calcCompleteness(merged), lastActive: new Date() })
      .where(eq(schema.users.id, req.userId!));

    res.json({ photoUrl: secureUrl });
  } catch (err) {
    req.log.error(err, "Photo upload error");
    res.status(500).json({ error: "Failed to upload photo" });
  }
});

// Get list of users this user has blocked
router.get("/me/blocked", requireAuth, async (req, res) => {
  try {
    const myId = req.userId!;
    const blockRows = await db
      .select({ blockedUserId: schema.blocks.blockedUserId })
      .from(schema.blocks)
      .where(eq(schema.blocks.blockerUserId, myId));

    const blockedUsers = [];
    for (const { blockedUserId } of blockRows) {
      const [row] = await db.select().from(schema.users).where(eq(schema.users.id, blockedUserId)).limit(1);
      if (row) blockedUsers.push(publicUser(toUser(row)));
    }

    res.json({ blocked: blockedUsers });
  } catch (err) {
    req.log.error(err, "Get blocked error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Block a user — also removes mutual likes, messages, and notifications
router.post("/:userId/block", requireAuth, async (req, res) => {
  try {
    const myId = req.userId!;
    const theirId = req.params.userId;

    if (myId === theirId) { res.status(400).json({ error: "Cannot block yourself" }); return; }

    await db.insert(schema.blocks)
      .values({ blockerUserId: myId, blockedUserId: theirId })
      .onConflictDoNothing();

    // Also unmatch: delete likes in both directions, all messages, and match/like/message notifications
    await db.execute(
      sql`DELETE FROM likes WHERE (from_id = ${myId} AND to_id = ${theirId}) OR (from_id = ${theirId} AND to_id = ${myId})`
    );
    await db.execute(
      sql`DELETE FROM messages WHERE (from_id = ${myId} AND to_id = ${theirId}) OR (from_id = ${theirId} AND to_id = ${myId})`
    );
    await db.execute(
      sql`DELETE FROM notifications WHERE ((user_id = ${myId} AND from_user_id = ${theirId}) OR (user_id = ${theirId} AND from_user_id = ${myId})) AND type IN ('like', 'match', 'message')`
    );

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "Block user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

// Unblock a user
router.delete("/:userId/block", requireAuth, async (req, res) => {
  try {
    const myId = req.userId!;
    const theirId = req.params.userId;

    await db.delete(schema.blocks)
      .where(and(eq(schema.blocks.blockerUserId, myId), eq(schema.blocks.blockedUserId, theirId)));

    res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "Unblock user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [row] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.params.id))
      .limit(1);

    if (!row) { res.status(404).json({ error: "User not found" }); return; }
    res.json(publicUser(toUser(row)));
  } catch (err) {
    req.log.error(err, "Get user error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
