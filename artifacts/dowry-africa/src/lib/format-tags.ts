export const TAG_LABELS: Record<string, string> = {
  // Intent / relationship goal
  marriage_ready:          "💍 Marriage Ready",
  serious_relationship:    "🌱 Serious",
  friendship_first:        "🤝 Friendship First",
  open_to_dating:          "💫 Open to Dating",
  not_sure:                "🤔 Exploring",

  // Faith
  christian:               "✝️ Christian",
  christianity:            "✝️ Christian",
  muslim:                  "☪️ Muslim",
  islam:                   "☪️ Muslim",
  traditional:             "🌿 Traditional",
  spiritual:               "🔮 Spiritual",
  "spiritual but not religious": "🔮 Spiritual",
  "any / open":            "🤍 Any / Open",
  other:                   "🌍 Other",

  // Children
  yes:                     "👶 Wants children",
  no:                      "🚫 No children",
  open:                    "🤍 Open",

  // Timeline
  asap:                    "⚡ Ready now",
  "1_year":                "📅 Within 1 year",
  "2_years":               "📅 Within 2 years",
  "5_years":               "📅 Within 5 years",
  not_sure_yet:            "🤔 Not sure yet",
  "within 1 year":         "📅 Within 1 year",
  "1-2 years":             "📅 1–2 years",
  "3+ years":              "📅 3+ years",
  "not sure yet":          "🤔 Not sure yet",
};

/**
 * Format any raw database tag/value into a human-readable display string.
 * Falls back to Title Case with underscores replaced by spaces.
 */
export function formatTag(raw: string | null | undefined): string {
  if (!raw) return "";
  const key = raw.toLowerCase().trim();
  if (TAG_LABELS[key]) return TAG_LABELS[key];
  return raw.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Dedicated formatter for the "intent" field (relationship goal).
 * Always returns the emoji-prefixed label.
 */
export function formatIntentLabel(raw: string | null | undefined): string {
  return formatTag(raw);
}
