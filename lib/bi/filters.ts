import { DEFAULT_PRESET, GRAINS, defaultGrain, resolvePeriod, type Grain, type Period } from "./period";

/*
 * The dashboard's global filter bar lives in the URL so every report and
 * drill-down link shares the same slice. Client-safe (no DB access).
 */

export type Channel = "online" | "offline";
export type Buyer = "individual" | "school" | "vendor";
export type SearchParams = Record<string, string | string[] | undefined>;

export type DashFilters = {
  period: Period;
  channel: Channel | null;
  buyer: Buyer | null;
  category: string | null; // Category.id; includes its whole subtree
  grain: Grain;
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseFilters(sp: SearchParams): DashFilters {
  const period = resolvePeriod(one(sp.range) ?? DEFAULT_PRESET, one(sp.from), one(sp.to));
  const ch = one(sp.channel);
  const by = one(sp.buyer);
  const g = one(sp.grain);
  return {
    period,
    channel: ch === "online" || ch === "offline" ? ch : null,
    buyer: by === "individual" || by === "school" || by === "vendor" ? by : null,
    category: one(sp.cat) || null,
    grain: GRAINS.some(([k]) => k === g) ? (g as Grain) : defaultGrain(period.from, period.to),
  };
}

/** Keep the filter params when linking between dashboard pages, optionally overriding some. */
export function withFilters(path: string, sp: SearchParams, extra: Record<string, string | null> = {}): string {
  const q = new URLSearchParams();
  for (const k of ["range", "from", "to", "channel", "buyer", "cat", "grain"]) {
    const v = one(sp[k]);
    if (v) q.set(k, v);
  }
  for (const [k, v] of Object.entries(extra)) {
    if (v === null) q.delete(k);
    else q.set(k, v);
  }
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

export const CHANNEL_LABEL: Record<Channel, string> = { online: "Website", offline: "Physical store" };
export const BUYER_LABEL: Record<Buyer, string> = { individual: "Individual", school: "School", vendor: "Vendor" };

export { GRAINS as GRAINS_LINKS } from "./period";
