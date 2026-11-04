import type { Column } from "@/components/dashboard/ColumnChart";
import { summarize, type Facts, type Summary } from "./facts";
import { bucketLabel, bucketStart, istDay, nextBucket, type Grain } from "./period";
import { inr } from "./format";

/** Summary per time bucket (IST), oldest first, up to now. */
export function bucketSummaries(facts: Facts, from: Date, to: Date, grain: Grain): { start: Date; s: Summary }[] {
  const key = (d: Date) => bucketStart(d, grain).getTime();
  const group = <T extends { at: Date }>(xs: T[]) => {
    const m = new Map<number, T[]>();
    for (const x of xs) m.set(key(x.at), [...(m.get(key(x.at)) ?? []), x]);
    return m;
  };
  const lines = group(facts.lines), rets = group(facts.returns), sets = group(facts.settlements);
  const out: { start: Date; s: Summary }[] = [];
  const end = new Date(Math.min(to.getTime(), Date.now()));
  for (let b = bucketStart(from, grain); b < end; b = nextBucket(b, grain)) {
    const k = b.getTime();
    out.push({ start: b, s: summarize(lines.get(k) ?? [], rets.get(k) ?? [], facts.orders, sets.get(k) ?? [], facts.categoryScoped) });
  }
  return out;
}

/** Net-sales columns per time bucket, with every other headline metric in the tooltip/table. */
export function buildTrend(facts: Facts, from: Date, to: Date, grain: Grain): Column[] {
  return bucketSummaries(facts, from, to, grain).map(({ start: b, s }) => {
    const details: [string, string][] = [
      ["Transactions", String(s.transactions)],
      ["Gross", inr(s.gross)],
      ["Discount", inr(s.discount)],
      ["Returns", inr(s.returns)],
    ];
    if (!facts.categoryScoped) details.push(["Collected", inr(s.collected)], ["Credit generated", inr(s.creditGenerated)]);
    return { key: istDay(b), label: bucketLabel(b, grain), value: s.net, valueText: inr(s.net), details };
  });
}
