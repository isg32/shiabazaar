import type { Column } from "@/components/dashboard/ColumnChart";
import { summarize, type Facts } from "./facts";
import { bucketLabel, bucketStart, istDay, nextBucket, type Grain } from "./period";
import { inr } from "./format";

/** Net-sales columns per time bucket, with every other headline metric in the tooltip/table. */
export function buildTrend(facts: Facts, from: Date, to: Date, grain: Grain): Column[] {
  const key = (d: Date) => bucketStart(d, grain).getTime();
  const group = <T extends { at: Date }>(xs: T[]) => {
    const m = new Map<number, T[]>();
    for (const x of xs) m.set(key(x.at), [...(m.get(key(x.at)) ?? []), x]);
    return m;
  };
  const lines = group(facts.lines), rets = group(facts.returns), sets = group(facts.settlements);

  const cols: Column[] = [];
  const end = new Date(Math.min(to.getTime(), Date.now()));
  for (let b = bucketStart(from, grain); b < end; b = nextBucket(b, grain)) {
    const k = b.getTime();
    const s = summarize(lines.get(k) ?? [], rets.get(k) ?? [], facts.orders, sets.get(k) ?? [], facts.categoryScoped);
    const details: [string, string][] = [
      ["Transactions", String(s.transactions)],
      ["Gross", inr(s.gross)],
      ["Discount", inr(s.discount)],
      ["Returns", inr(s.returns)],
    ];
    if (!facts.categoryScoped) details.push(["Collected", inr(s.collected)], ["Credit generated", inr(s.creditGenerated)]);
    cols.push({ key: istDay(b), label: bucketLabel(b, grain), value: s.net, valueText: inr(s.net), details });
  }
  return cols;
}
