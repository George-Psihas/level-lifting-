// Game logic: leveling, rewards catalog, weekly progress evaluation

export const XP_PER_WORKOUT_BASE = 25;
export const XP_PER_MINUTE = 1;
export const XP_PER_LIFT_PR = 40;
export const XP_PER_SUPPLEMENT_DAY = 15;

// Weight unit: stored numbers represent POUNDS. The DB column is still
// called weight_kg for legacy reasons — treat values as lbs throughout UI.
export const WEIGHT_UNIT = "lbs" as const;

export function xpForNextLevel(level: number): number {
  return 100 + (level - 1) * 60;
}

export function totalXpToLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) total += xpForNextLevel(i);
  return total;
}

export function levelFromXp(xp: number): { level: number; intoLevel: number; needed: number; progress: number } {
  let level = 1;
  let remaining = xp;
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level++;
  }
  const needed = xpForNextLevel(level);
  return { level, intoLevel: remaining, needed, progress: remaining / needed };
}

export type RewardKey =
  // Hats (5)
  | "hat-cap" | "hat-snapback" | "hat-beanie" | "hat-bucket" | "hat-visor"
  // Sunglasses (5)
  | "glass-sport" | "glass-wrap" | "glass-mirrored" | "glass-square" | "glass-aviator"
  // Outfits (6)
  | "outfit-compression" | "outfit-sleeveless" | "outfit-tshirt" | "outfit-hoodie" | "outfit-trackset" | "outfit-stringer"
  // Color accents (7)
  | "accent-grey" | "accent-orange" | "accent-yellow" | "accent-purple" | "accent-red" | "accent-blue" | "accent-white"
  // Cups (level-based, 12 tiers)
  | "cup-starter" | "cup-iron" | "cup-energy" | "cup-pulse" | "cup-elite" | "cup-champion"
  | "cup-dominator" | "cup-frost" | "cup-neon" | "cup-inferno" | "cup-cosmic" | "cup-legend"
  // Legacy day-based cups kept for old saves
  | "cup-classic" | "cup-flame" | "cup-galaxy" | "cup-gold" | "cup-titan";

export type RewardSlot = "head" | "eyes" | "shirt" | "aura" | "cup";

export interface Reward {
  key: RewardKey;
  name: string;
  slot: RewardSlot;
  unlockLevel: number;
  unlockDays?: number;
  description: string;
}

export const REWARDS: Reward[] = [
  // ── Outfits ────────────────────────────────────────────────
  { key: "outfit-compression", name: "Performance Compression", slot: "shirt", unlockLevel: 1,  description: "Full-sleeve compression fit. Day-one drip." },
  { key: "outfit-sleeveless",  name: "Sleeveless Tank",         slot: "shirt", unlockLevel: 5,  description: "Cut sleeves. Veins on display." },
  { key: "outfit-tshirt",      name: "Athletic T-Shirt",        slot: "shirt", unlockLevel: 9,  description: "Clean black tee. Always works." },
  { key: "outfit-hoodie",      name: "Hoodie Fit",              slot: "shirt", unlockLevel: 13, description: "Hood up. Focus mode engaged." },
  { key: "outfit-trackset",    name: "Training Set",            slot: "shirt", unlockLevel: 17, description: "Full track jacket and pants. Pro tier." },
  { key: "outfit-stringer",    name: "Stringer Tank",           slot: "shirt", unlockLevel: 20, description: "Endgame aesthetic. Stage-ready." },

  // ── Hats ──────────────────────────────────────────────────
  { key: "hat-cap",       name: "Baseball Cap", slot: "head", unlockLevel: 3,  description: "Classic curved-brim cap." },
  { key: "hat-beanie",    name: "Knit Beanie",  slot: "head", unlockLevel: 7,  description: "Warm-up gear, cold-gym energy." },
  { key: "hat-snapback",  name: "Snapback",     slot: "head", unlockLevel: 11, description: "Flat brim. Flat ego." },
  { key: "hat-bucket",    name: "Bucket Hat",   slot: "head", unlockLevel: 15, description: "Festival lifter aesthetic." },
  { key: "hat-visor",     name: "Sport Visor",  slot: "head", unlockLevel: 19, description: "Top-open. Pure shade." },

  // ── Sunglasses ────────────────────────────────────────────
  { key: "glass-sport",    name: "Sport Sunglasses",   slot: "eyes", unlockLevel: 4,  description: "Sleek athletic frames." },
  { key: "glass-wrap",     name: "Wrap Sunglasses",    slot: "eyes", unlockLevel: 8,  description: "Wraparound coverage." },
  { key: "glass-mirrored", name: "Mirrored Shades",    slot: "eyes", unlockLevel: 12, description: "Reflective lenses. Mystery mode." },
  { key: "glass-square",   name: "Square Sunglasses",  slot: "eyes", unlockLevel: 16, description: "Sharp matte-black squares." },
  { key: "glass-aviator",  name: "Aviator Sunglasses", slot: "eyes", unlockLevel: 20, description: "Gold-rim aviators. Boss tier." },

  // ── Color accents (outfit glow) ───────────────────────────
  { key: "accent-grey",   name: "Grey Aura",   slot: "aura", unlockLevel: 5,   description: "First spark. Quiet steel." },
  { key: "accent-orange", name: "Orange Aura", slot: "aura", unlockLevel: 10,  description: "Furnace heat rising." },
  { key: "accent-yellow", name: "Yellow Aura", slot: "aura", unlockLevel: 15,  description: "Golden burst. Stage one." },
  { key: "accent-purple", name: "Purple Aura", slot: "aura", unlockLevel: 20,  description: "Royal violet flame." },
  { key: "accent-red",    name: "Red Aura",    slot: "aura", unlockLevel: 25,  description: "Blood-pump intensity." },
  { key: "accent-blue",   name: "Blue Aura",   slot: "aura", unlockLevel: 30,  description: "Electric blue current." },
  { key: "accent-white",  name: "White Aura",  slot: "aura", unlockLevel: 100, description: "Ultra instinct — white with blue tint." },

  // Cup skins — unlocked by SUPPLEMENT STREAK (each week = 2 cup levels)
  // Days required for cup level L = ceil((L-1) * 3.5)
  { key: "cup-starter",   name: "Starter",   slot: "cup", unlockLevel: 1,  unlockDays: 0,  description: "Day-one matte black shaker. The journey starts." },
  { key: "cup-iron",      name: "Iron",      slot: "cup", unlockLevel: 2,  unlockDays: 4,  description: "Forged matte. Iron Arena issue." },
  { key: "cup-energy",    name: "Energy",    slot: "cup", unlockLevel: 3,  unlockDays: 7,  description: "Acid-green rim. Pre-workout fuel." },
  { key: "cup-pulse",     name: "Pulse",     slot: "cup", unlockLevel: 4,  unlockDays: 11, description: "Electric blue current crackling down the shell." },
  { key: "cup-elite",     name: "Elite",     slot: "cup", unlockLevel: 5,  unlockDays: 14, description: "Royal violet trim. Elite club only." },
  { key: "cup-champion",  name: "Champion",  slot: "cup", unlockLevel: 6,  unlockDays: 18, description: "Black & gold. Podium energy." },
  { key: "cup-dominator", name: "Dominator", slot: "cup", unlockLevel: 7,  unlockDays: 21, description: "Lava cracks. Pure domination." },
  { key: "cup-frost",     name: "Frost",     slot: "cup", unlockLevel: 8,  unlockDays: 25, description: "Frozen-over shell. Ice-cold hydration." },
  { key: "cup-neon",      name: "Neon",      slot: "cup", unlockLevel: 9,  unlockDays: 28, description: "Magenta neon glow. Night-lift aesthetic." },
  { key: "cup-inferno",   name: "Inferno",   slot: "cup", unlockLevel: 10, unlockDays: 32, description: "Molten red core. You're on fire." },
  { key: "cup-cosmic",    name: "Cosmic",    slot: "cup", unlockLevel: 11, unlockDays: 35, description: "Galaxy wrap. Gains beyond gravity." },
  { key: "cup-legend",    name: "Legend",    slot: "cup", unlockLevel: 12, unlockDays: 39, description: "Winged gold emblem. Legend status." },
];

// Cup skin level from current consecutive-day streak
export function cupLevelFromStreak(streak: number): number {
  let lvl = 1;
  for (const r of REWARDS) {
    if (r.slot !== "cup") continue;
    if ((r.unlockDays ?? 0) <= streak && r.unlockLevel > lvl) lvl = r.unlockLevel;
  }
  return lvl;
}

export function cupRewardsForStreak(streak: number): Reward[] {
  return REWARDS.filter((r) => r.slot === "cup" && (r.unlockDays ?? Infinity) <= streak);
}

// ──────────────────────────────────────────────────────────────────
// Daily challenges — 3 for the avatar, 3 for the cup. Bonus XP on claim.
export type ChallengeScope = "avatar" | "cup";
export interface DailyChallenge {
  key: string;
  scope: ChallengeScope;
  name: string;
  description: string;
  xp: number;
}
export const DAILY_CHALLENGES: DailyChallenge[] = [
  { key: "av-workout",  scope: "avatar", name: "Log a workout", description: "Record at least one workout today.",        xp: 30 },
  { key: "av-sets",     scope: "avatar", name: "Hit 3 sets",    description: "Log 3+ exercise sets today.",                xp: 25 },
  { key: "av-meal",     scope: "avatar", name: "Track a meal",  description: "Log at least one meal today.",               xp: 20 },
  { key: "cup-scoop",   scope: "cup",    name: "Daily scoop",   description: "Log a supplement scoop today.",              xp: 15 },
  { key: "cup-streak3", scope: "cup",    name: "3-day streak",  description: "Maintain a 3+ day supplement streak.",       xp: 25 },
  { key: "cup-variety", scope: "cup",    name: "Mix it up",     description: "Log 2 different supplement kinds today.",    xp: 20 },
];

// ──────────────────────────────────────────────────────────────────
// Titles — earned by level. Used on profile, leaderboard, avatar badge.
export interface Title { minLevel: number; name: string; tag: string; }
export const TITLES: Title[] = [
  { minLevel: 1,  name: "Beginner",  tag: "NEW BLOOD" },
  { minLevel: 3,  name: "Rookie",    tag: "ROOKIE" },
  { minLevel: 5,  name: "Grinder",   tag: "GRINDER" },
  { minLevel: 8,  name: "Warrior",   tag: "WARRIOR" },
  { minLevel: 12, name: "Veteran",   tag: "VETERAN" },
  { minLevel: 16, name: "Elite",     tag: "ELITE" },
  { minLevel: 20, name: "Champion",  tag: "CHAMPION" },
  { minLevel: 25, name: "Master",    tag: "MASTER" },
  { minLevel: 30, name: "Legend",    tag: "LEGEND" },
  { minLevel: 40, name: "Mythic",    tag: "MYTHIC" },
  { minLevel: 50, name: "Titan",     tag: "TITAN" },
];
export function titleForLevel(level: number): Title {
  let t = TITLES[0];
  for (const x of TITLES) if (level >= x.minLevel) t = x;
  return t;
}

// ──────────────────────────────────────────────────────────────────
// Hairstyles — pick at LV 10+. Distinct male and female options.
export type Hairstyle =
  | "none"
  | "m-buzz" | "m-fade" | "m-quiff" | "m-curls" | "m-bun" | "m-mohawk" | "m-long" | "m-dreads"
  | "f-pony" | "f-bun" | "f-bob" | "f-long" | "f-braids" | "f-curls" | "f-pixie" | "f-side";

export const HAIRSTYLES: { key: Hairstyle; name: string; style: "male" | "female" }[] = [
  { key: "m-buzz",   name: "Buzz Cut",      style: "male" },
  { key: "m-fade",   name: "High Fade",     style: "male" },
  { key: "m-quiff",  name: "Quiff",         style: "male" },
  { key: "m-curls",  name: "Curl Top",      style: "male" },
  { key: "m-bun",    name: "Man Bun",       style: "male" },
  { key: "m-mohawk", name: "Mohawk",        style: "male" },
  { key: "m-long",   name: "Long Flow",     style: "male" },
  { key: "m-dreads", name: "Dreads",        style: "male" },
  { key: "f-pony",   name: "Ponytail",      style: "female" },
  { key: "f-bun",    name: "Top Bun",       style: "female" },
  { key: "f-bob",    name: "Bob",           style: "female" },
  { key: "f-long",   name: "Long Straight", style: "female" },
  { key: "f-braids", name: "Braids",        style: "female" },
  { key: "f-curls",  name: "Curls",         style: "female" },
  { key: "f-pixie",  name: "Pixie Cut",     style: "female" },
  { key: "f-side",   name: "Side Swept",    style: "female" },
];
export const HAIRSTYLE_UNLOCK_LEVEL = 10;


export const CUP_REWARDS = REWARDS.filter((r) => r.slot === "cup");

export function rewardsUpToLevel(level: number): Reward[] {
  return REWARDS.filter((r) => r.slot !== "cup" && r.unlockLevel <= level);
}

export function newRewardsBetween(prevLevel: number, newLevel: number): Reward[] {
  return REWARDS.filter((r) => r.slot !== "cup" && r.unlockLevel > prevLevel && r.unlockLevel <= newLevel);
}

export function cupRewardsForDays(days: number): Reward[] {
  return CUP_REWARDS.filter((r) => (r.unlockDays ?? Infinity) <= days);
}

export function newCupRewardsBetween(prevDays: number, newDays: number): Reward[] {
  return CUP_REWARDS.filter((r) => {
    const d = r.unlockDays ?? Infinity;
    return d > prevDays && d <= newDays;
  });
}

export function cupRewardsForLevel(level: number): Reward[] {
  return CUP_REWARDS.filter((r) => r.unlockLevel > 0 && r.unlockLevel <= level);
}

export function newCupRewardsByLevelBetween(prevLevel: number, newLevel: number): Reward[] {
  return CUP_REWARDS.filter((r) => r.unlockLevel > 0 && r.unlockLevel > prevLevel && r.unlockLevel <= newLevel);
}

// e1RM-ish strength score for a single set
export function setScore(weight: number, reps: number): number {
  if (reps <= 0) return 0;
  return weight * (1 + reps / 30);
}

export interface ExerciseSetRow {
  exercise_name: string;
  weight_kg: number; // legacy column name — interpreted as pounds
  reps: number;
  created_at: string;
}

export interface WeeklyComparison {
  exercise: string;
  thisWeekBest: number;
  lastWeekBest: number;
  delta: number;
  improved: boolean;
}

export function startOfIsoWeek(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

export function computeWeeklyProgress(sets: ExerciseSetRow[], now = new Date()): WeeklyComparison[] {
  const thisStart = startOfIsoWeek(now);
  const lastStart = new Date(thisStart);
  lastStart.setDate(lastStart.getDate() - 7);

  const best: Record<string, { current: number; previous: number }> = {};
  for (const s of sets) {
    const ts = new Date(s.created_at);
    const score = setScore(Number(s.weight_kg), Number(s.reps));
    const name = s.exercise_name.trim();
    if (!best[name]) best[name] = { current: 0, previous: 0 };
    if (ts >= thisStart) best[name].current = Math.max(best[name].current, score);
    else if (ts >= lastStart) best[name].previous = Math.max(best[name].previous, score);
  }

  return Object.entries(best)
    .filter(([, v]) => v.current > 0 || v.previous > 0)
    .map(([exercise, v]) => ({
      exercise,
      thisWeekBest: Math.round(v.current * 10) / 10,
      lastWeekBest: Math.round(v.previous * 10) / 10,
      delta: Math.round((v.current - v.previous) * 10) / 10,
      improved: v.current > v.previous && v.previous > 0,
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

// Count distinct local-date days from a list of supplement log timestamps
export function distinctDayCount(timestamps: string[]): number {
  const days = new Set<string>();
  for (const ts of timestamps) {
    const d = new Date(ts);
    days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  return days.size;
}

// Compute current consecutive-day streak ending today (or yesterday if not yet logged today)
export function currentStreak(timestamps: string[], now = new Date()): number {
  if (timestamps.length === 0) return 0;
  const days = new Set<string>();
  for (const ts of timestamps) {
    const d = new Date(ts);
    days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  }
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const today = new Date(now); today.setHours(0,0,0,0);
  let cursor = new Date(today);
  if (!days.has(key(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(key(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export const SUGGESTED_EXERCISES = [
  "Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row",
  "Pull Up", "Dumbbell Curl", "Lat Pulldown", "Leg Press", "Hip Thrust",
];
