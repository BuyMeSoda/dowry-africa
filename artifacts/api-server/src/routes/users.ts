import { Router } from "express";
import { users, sanitizeUser, publicUser, updateUserCompleteness } from "../db/database.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/me/profile", requireAuth, (req, res) => {
  const user = users.get(req.userId!);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json(sanitizeUser(user));
});

router.patch("/me/profile", requireAuth, (req, res) => {
  const user = users.get(req.userId!);
  if (!user) { res.status(404).json({ error: "Not found" }); return; }

  const allowed = [
    "city", "country", "heritage", "faith", "languages",
    "intent", "lifeStage", "childrenPref", "marriageTimeline",
    "familyInvolvement", "relocationOpen", "bio", "quote", "photoUrl",
    "genderPref", "minAge", "maxAge",
    "preferredFaith", "preferredCountry", "preferredHeritage"
  ];

  for (const key of allowed) {
    if (key in req.body) {
      (user as any)[key] = req.body[key];
    }
  }

  updateUserCompleteness(user);
  user.lastActive = new Date();
  res.json(sanitizeUser(user));
});

router.get("/:id", requireAuth, (req, res) => {
  const user = users.get(req.params.id);
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json(publicUser(user));
});

export default router;
