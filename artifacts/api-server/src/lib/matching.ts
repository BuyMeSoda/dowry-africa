import { User } from "../db/database.js";

export interface ScoreDimensions {
  values: number;
  lifeStage: number;
  cultural: number;
  practical: number;
  engagement: number;
}

export interface MatchScore {
  score: number;
  dimensions: ScoreDimensions;
  prompts: string[];
}

const INTENT_ORDER = ["marriage_ready", "serious_relationship", "friendship_first"];

function intentScore(a?: string, b?: string): number {
  if (!a || !b) return 50;
  if (a === b) return 100;
  const ai = INTENT_ORDER.indexOf(a);
  const bi = INTENT_ORDER.indexOf(b);
  const diff = Math.abs(ai - bi);
  if (diff === 1) return 60;
  return 20;
}

function faithScore(a?: string, b?: string): number {
  if (!a || !b) return 60;
  if (a === b) return 100;
  return 30;
}

function familyScore(a?: string, b?: string): number {
  if (!a || !b) return 60;
  if (a === b) return 100;
  const levels = ["low", "medium", "high"];
  const ai = levels.indexOf(a);
  const bi = levels.indexOf(b);
  return ai === -1 || bi === -1 ? 60 : Math.max(0, 100 - Math.abs(ai - bi) * 40);
}

function childrenScore(a?: string, b?: string): number {
  if (!a || !b) return 60;
  if (a === b) return 100;
  if ((a === "yes" && b === "no") || (a === "no" && b === "yes")) return 10;
  return 50;
}

function timelineScore(a?: string, b?: string): number {
  const order = ["asap", "1_year", "2_years", "5_years", "not_sure"];
  if (!a || !b) return 60;
  if (a === b) return 100;
  const ai = order.indexOf(a);
  const bi = order.indexOf(b);
  if (ai === -1 || bi === -1) return 60;
  return Math.max(0, 100 - Math.abs(ai - bi) * 25);
}

function valuesScore(a: User, b: User): number {
  const intent = intentScore(a.intent, b.intent);
  const faith = faithScore(a.faith, b.faith);
  const family = familyScore(a.familyInvolvement, b.familyInvolvement);
  const children = childrenScore(a.childrenPref, b.childrenPref);
  const timeline = timelineScore(a.marriageTimeline, b.marriageTimeline);
  return Math.round((intent + faith + family + children + timeline) / 5);
}

const LIFE_STAGE_TABLE: Record<string, Record<string, number>> = {
  marriage_ready: { marriage_ready: 100, serious_relationship: 70, friendship_first: 30 },
  serious_relationship: { marriage_ready: 70, serious_relationship: 100, friendship_first: 60 },
  friendship_first: { marriage_ready: 30, serious_relationship: 60, friendship_first: 100 },
};

function lifeStageScore(a: User, b: User): number {
  if (!a.lifeStage || !b.lifeStage) return 60;
  const base = LIFE_STAGE_TABLE[a.lifeStage]?.[b.lifeStage] ?? 50;
  let score = base;
  if (a.hasBadge) score = Math.min(100, score + 5);
  const completeBoost = Math.round(a.completeness * 0.1);
  return Math.min(100, score + completeBoost);
}

function overlap(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  return a.filter(x => b.includes(x)).length;
}

// Diaspora countries (both abbreviated and full forms used across seed/user data)
const DIASPORA_COUNTRIES = new Set([
  "United Kingdom", "UK", "United States", "US", "USA",
  "Canada", "Australia", "France", "Germany", "Netherlands", "Ireland",
]);

function culturalScore(a: User, b: User): number {
  // heritage now stores country of origin (e.g. "Nigeria", "Ghana")
  // Shared origin country → strong cultural signal
  const originOverlap = overlap(a.heritage, b.heritage) > 0 ? 100 : 25;
  const langOverlap = overlap(a.languages, b.languages) > 0 ? 80 : 40;
  const residenceMatch = a.country === b.country ? 100 : 50;
  const bothDiaspora = (DIASPORA_COUNTRIES.has(a.country ?? "") && DIASPORA_COUNTRIES.has(b.country ?? "")) ? 80 : 50;

  return Math.round((originOverlap * 0.45 + langOverlap * 0.30 + residenceMatch * 0.15 + bothDiaspora * 0.10));
}

function practicalScore(a: User, b: User): number {
  const cityMatch = a.city && b.city && a.city.toLowerCase() === b.city.toLowerCase() ? 100 : 30;
  const countryMatch = a.country === b.country ? 100 : 40;
  const relocOpen = (a.relocationOpen || b.relocationOpen) ? 80 : 40;

  return Math.round((cityMatch * 0.4 + countryMatch * 0.4 + relocOpen * 0.2));
}

function engagementScore(a: User, b: User): number {
  const now = Date.now();
  const hoursSinceActive = (now - b.lastActive.getTime()) / (1000 * 60 * 60);
  const recencyScore = hoursSinceActive < 48 ? 100 : hoursSinceActive < 168 ? 70 : 40;
  const badgeScore = b.hasBadge ? 100 : b.tier === "core" ? 70 : 40;
  return Math.round((recencyScore * 0.6 + badgeScore * 0.4));
}

export function passesHardFilters(me: User, candidate: User): boolean {
  if (me.id === candidate.id) return false;
  if (me.blocked.includes(candidate.id) || candidate.blocked.includes(me.id)) return false;

  if (me.genderPref && me.genderPref !== candidate.gender) return false;
  if (candidate.genderPref && candidate.genderPref !== me.gender) return false;

  const age = candidate.age;
  if (me.minAge && age < me.minAge) return false;
  if (me.maxAge && age > me.maxAge) return false;

  if (me.intent === "marriage_ready" && candidate.intent === "friendship_first") return false;

  return true;
}

export function scoreMatch(me: User, candidate: User): MatchScore {
  const dims: ScoreDimensions = {
    values: valuesScore(me, candidate),
    lifeStage: lifeStageScore(me, candidate),
    cultural: culturalScore(me, candidate),
    practical: practicalScore(me, candidate),
    engagement: engagementScore(me, candidate),
  };

  const raw =
    dims.values * 0.30 +
    dims.lifeStage * 0.25 +
    dims.cultural * 0.20 +
    dims.practical * 0.15 +
    dims.engagement * 0.10;

  let score = Math.round(raw);

  if (candidate.hasBadge) score = Math.min(100, score + 5);

  const now = Date.now();
  const freshBoost = (now - candidate.lastActive.getTime()) < 48 * 60 * 60 * 1000;
  if (freshBoost) score = Math.min(100, score + 3);

  const prompts = generatePrompts(me, candidate, dims);

  return { score, dimensions: dims, prompts };
}

function generatePrompts(me: User, candidate: User, dims: ScoreDimensions): string[] {
  const prompts: string[] = [];

  if (dims.values >= 80) {
    prompts.push(`You both share a deep commitment to ${me.intent === "marriage_ready" ? "building a lasting marriage" : "serious partnership"}.`);
  }

  if (me.faith !== candidate.faith && dims.values < 70) {
    prompts.push(`You come from different faith backgrounds — ask them how faith shapes their daily life.`);
  }

  if (dims.cultural < 50) {
    prompts.push(`Your cultural backgrounds are beautifully different — ask about their favorite traditions growing up.`);
  }

  if (dims.cultural >= 80 && overlap(me.heritage, candidate.heritage) > 0) {
    const shared = me.heritage.filter(h => candidate.heritage.includes(h));
    prompts.push(`You're both connected to ${shared.join(" and ")} — you'll have so much to talk about!`);
  }

  if (dims.practical < 40) {
    prompts.push(`You're in different cities — discuss openness to relocation and what home means to each of you.`);
  }

  if (dims.values < 60 && me.marriageTimeline !== candidate.marriageTimeline) {
    prompts.push(`Your marriage timelines differ — an honest conversation about timing could be powerful.`);
  }

  if (dims.values >= 85 && dims.lifeStage >= 80) {
    prompts.push(`Your life intentions are beautifully aligned. This could be a meaningful connection.`);
  }

  return prompts.slice(0, 3);
}

export function rankFeed(me: User, scores: Array<{ user: User; score: number; dimensions: ScoreDimensions; prompts: string[] }>) {
  return scores.sort((a, b) => {
    if (a.user.hasBadge && !b.user.hasBadge) return -1;
    if (!a.user.hasBadge && b.user.hasBadge) return 1;
    return b.score - a.score;
  });
}
