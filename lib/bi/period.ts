/*
 * Date-range presets for the BI dashboard, computed in IST. No DB access — safe
 * to import from client components (the filter bar) and server code alike.
 */

export const PRESETS = [
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["7d", "Last 7 days"],
  ["30d", "Last 30 days"],
  ["thisweek", "This week"],
  ["lastweek", "Last week"],
  ["thismonth", "This month"],
  ["lastmonth", "Last month"],
  ["thisquarter", "This quarter"],
  ["thisyear", "This year"],
  ["fy", "Financial year"],
  ["custom", "Custom range"],
] as const;
export type Preset = (typeof PRESETS)[number][0];
export const DEFAULT_PRESET: Preset = "30d";

export const GRAINS = [
  ["day", "Daily"],
  ["week", "Weekly"],
  ["month", "Monthly"],
  ["quarter", "Quarterly"],
  ["year", "Yearly"],
] as const;
export type Grain = (typeof GRAINS)[number][0];

const IST_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

/** A wall-clock date in IST, represented as a UTC Date whose UTC fields are the IST fields. */
const toIst = (d: Date) => new Date(d.getTime() + IST_MS);
const fromIst = (ist: Date) => new Date(ist.getTime() - IST_MS);
const istMidnight = (y: number, m: number, day: number) => fromIst(new Date(Date.UTC(y, m, day)));

export type Period = { preset: Preset; from: Date; to: Date; label: string; prevFrom: Date; prevTo: Date };

/** Parse "YYYY-MM-DD" as IST midnight. */
export function parseDay(s: string | undefined | null): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const out = istMidnight(y, m - 1, d);
  return Number.isNaN(out.getTime()) ? null : out;
}

/** IST calendar date "YYYY-MM-DD" of an instant. */
export function istDay(d: Date): string {
  return toIst(d).toISOString().slice(0, 10);
}

const fmt = (d: Date) => toIst(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/**
 * Resolve a preset (or custom from/to, inclusive days) into a half-open
 * [from, to) range plus the immediately preceding range of equal length,
 * used for "vs previous period" deltas.
 */
export function resolvePeriod(preset: string | undefined, fromStr?: string, toStr?: string, now = new Date()): Period {
  const p = (PRESETS.some(([k]) => k === preset) ? preset : DEFAULT_PRESET) as Preset;
  const n = toIst(now);
  const Y = n.getUTCFullYear(), M = n.getUTCMonth(), D = n.getUTCDate();
  const today = istMidnight(Y, M, D);
  const dow = (n.getUTCDay() + 6) % 7; // Monday = 0
  const q0 = Math.floor(M / 3) * 3;
  const fyY = M >= 3 ? Y : Y - 1;

  let from: Date, to: Date;
  let prevFrom: Date | null = null, prevTo: Date | null = null;
  switch (p) {
    case "today": from = today; to = new Date(today.getTime() + DAY_MS); break;
    case "yesterday": from = new Date(today.getTime() - DAY_MS); to = today; break;
    case "7d": from = new Date(today.getTime() - 6 * DAY_MS); to = new Date(today.getTime() + DAY_MS); break;
    case "thisweek": from = new Date(today.getTime() - dow * DAY_MS); to = new Date(from.getTime() + 7 * DAY_MS); break;
    case "lastweek": to = new Date(today.getTime() - dow * DAY_MS); from = new Date(to.getTime() - 7 * DAY_MS); break;
    case "thismonth":
      from = istMidnight(Y, M, 1); to = istMidnight(Y, M + 1, 1);
      prevFrom = istMidnight(Y, M - 1, 1); prevTo = from; break;
    case "lastmonth":
      from = istMidnight(Y, M - 1, 1); to = istMidnight(Y, M, 1);
      prevFrom = istMidnight(Y, M - 2, 1); prevTo = from; break;
    case "thisquarter":
      from = istMidnight(Y, q0, 1); to = istMidnight(Y, q0 + 3, 1);
      prevFrom = istMidnight(Y, q0 - 3, 1); prevTo = from; break;
    case "thisyear":
      from = istMidnight(Y, 0, 1); to = istMidnight(Y + 1, 0, 1);
      prevFrom = istMidnight(Y - 1, 0, 1); prevTo = from; break;
    case "fy":
      from = istMidnight(fyY, 3, 1); to = istMidnight(fyY + 1, 3, 1);
      prevFrom = istMidnight(fyY - 1, 3, 1); prevTo = from; break;
    case "custom": {
      const f = parseDay(fromStr) ?? new Date(today.getTime() - 29 * DAY_MS);
      const t = parseDay(toStr) ?? today;
      from = f <= t ? f : t;
      to = new Date((f <= t ? t : f).getTime() + DAY_MS);
      break;
    }
    default: from = new Date(today.getTime() - 29 * DAY_MS); to = new Date(today.getTime() + DAY_MS);
  }
  if (!prevFrom || !prevTo) {
    const len = to.getTime() - from.getTime();
    prevTo = from;
    prevFrom = new Date(from.getTime() - len);
  }
  const label = PRESETS.find(([k]) => k === p)![1];
  const span = `${fmt(from)} – ${fmt(new Date(to.getTime() - 1))}`;
  return { preset: p, from, to, prevFrom, prevTo, label: p === "today" || p === "yesterday" ? `${label} · ${fmt(from)}` : `${label} · ${span}` };
}

/** Start of the bucket (IST) that `d` falls into, for trend charts. */
export function bucketStart(d: Date, grain: Grain): Date {
  const n = toIst(d);
  const Y = n.getUTCFullYear(), M = n.getUTCMonth(), D = n.getUTCDate();
  switch (grain) {
    case "day": return istMidnight(Y, M, D);
    case "week": return istMidnight(Y, M, D - ((n.getUTCDay() + 6) % 7));
    case "month": return istMidnight(Y, M, 1);
    case "quarter": return istMidnight(Y, Math.floor(M / 3) * 3, 1);
    case "year": return istMidnight(Y, 0, 1);
  }
}

export function nextBucket(d: Date, grain: Grain): Date {
  const n = toIst(d);
  const Y = n.getUTCFullYear(), M = n.getUTCMonth(), D = n.getUTCDate();
  switch (grain) {
    case "day": return istMidnight(Y, M, D + 1);
    case "week": return istMidnight(Y, M, D + 7);
    case "month": return istMidnight(Y, M + 1, 1);
    case "quarter": return istMidnight(Y, M + 3, 1);
    case "year": return istMidnight(Y + 1, 0, 1);
  }
}

export function bucketLabel(d: Date, grain: Grain): string {
  const n = toIst(d);
  const mon = n.toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" });
  switch (grain) {
    case "day": return `${n.getUTCDate()} ${mon}`;
    case "week": return `wk ${n.getUTCDate()} ${mon}`;
    case "month": return `${mon} ${String(n.getUTCFullYear()).slice(2)}`;
    case "quarter": return `Q${Math.floor(n.getUTCMonth() / 3) + 1} ${String(n.getUTCFullYear()).slice(2)}`;
    case "year": return String(n.getUTCFullYear());
  }
}

/** A sensible default grain for a range length. */
export function defaultGrain(from: Date, to: Date): Grain {
  const days = (to.getTime() - from.getTime()) / DAY_MS;
  if (days <= 45) return "day";
  if (days <= 190) return "week";
  if (days <= 800) return "month";
  return "quarter";
}
