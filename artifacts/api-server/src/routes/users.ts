import { Router } from "express";
import { eq } from "drizzle-orm";
import multer from "multer";
import { db } from "../db/connection.js";
import * as schema from "../db/schema.js";
import { toUser, sanitizeUser, publicUser, calcCompleteness } from "../db/database.js";
import { requireAuth } from "../middlewares/auth.js";
import { cloudinary } from "../lib/cloudinary.js";

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
