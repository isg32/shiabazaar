import type { Metadata } from "next";
import Link from "next/link";
import FilterBar from "@/components/dashboard/FilterBar";
import ShareBars from "@/components/dashboard/ShareBars";
import { loadFacts, summarize } from "@/lib/bi/facts";
import { BUYER_LABEL, parseFilters, withFilters, type Buyer, type SearchParams } from "@/lib/bi/filters";
import { inr } from "@/lib/bi/format";
import { VIZ } from "@/lib/bi/colors";
import { categoryOptions } from "@/lib/bi/categories";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Sales by buyer type" };

export default async function Buyers({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const [facts, cats, schoolOwed, vendorOwed] = await Promise.all([
    loadFacts(f, f.period.from, f.period.to),
    categoryOptions(),
    db.school.aggregate({ _sum: { balance: true }, where: { balance: { gt: 0 } } }),
    db.vendor.aggregate({ _sum: { balance: true }, where: { balance: { gt: 0 } } }),
  ]);
  const owed: Record<Buyer, number | null> = { individual: null, school: schoolOwed._sum.balance ?? 0, vendor: vendorOwed._sum.balance ?? 0 };

  const rows = (["individual", "school", "vendor"] as Buyer[]).map((b) => {
    const lines = facts.lines.filter((l) => l.buyer === b);
    const s = summarize(lines, facts.returns.filter((r) => r.buyer === b), facts.orders,
      facts.settlements.filter((p) => p.kind === b), facts.categoryScoped);
    const buyers = new Set<string>();
    for (const l of lines) {
      const o = facts.orders.get(l.orderId)!;
      const who = b === "school" ? o.schoolId : b === "vendor" ? o.vendorId : o.customerId ?? o.userId;
      if (who) buyers.add(who);
    }
    return { b, s, buyers: buyers.size };
  });
  const dash = (v: string) => (facts.categoryScoped ? "—" : v);

  return (
    <div className="px-8 py-8 text-on-dark">
      <h1 className="text-2xl font-semibold text-on-dark">Sales by buyer type</h1>
      <p className="text-sm text-on-dark-soft mt-0.5 mb-5">{f.period.label}</p>
      <FilterBar categories={cats}>
        <div className="grid lg:grid-cols-3 gap-6">
          <ShareBars title="Contribution to net sales" rows={rows.map(({ b, s }) => ({
            key: b, label: BUYER_LABEL[b], value: s.net, valueText: inr(s.net), color: VIZ.buyer[b],
            sub: `${s.transactions} transactions`, href: withFilters("/dashboard/transactions", sp, { buyer: b }),
          }))} />
          <div className="lg:col-span-2 bg-surface-dark-elevated rounded-xl border border-white/8 overflow-x-auto">
            <table className="w-full text-sm" data-testid="buyer-table">
              <thead>
                <tr className="border-b border-white/8">
                  {["Buyer type", "Net sales", "Buyers", "Transactions", "Avg order", "Discount", "Collected", "Credit generated", "Outstanding now"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {rows.map(({ b, s, buyers }) => (
                  <tr key={b} className="border-b border-white/5">
                    <td className="px-4 py-3">
                      <Link href={withFilters("/dashboard/transactions", sp, { buyer: b })} className="flex items-center gap-2 text-on-dark hover:underline">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: VIZ.buyer[b] }} />{BUYER_LABEL[b]}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-on-dark font-medium">{inr(s.net)}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{buyers}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{s.transactions}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{inr(s.avg)}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{inr(s.discount)}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{dash(inr(s.collected))}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{b === "individual" ? "—" : dash(inr(s.creditGenerated))}</td>
                    <td className="px-4 py-3 text-on-dark-soft">
                      {owed[b] == null ? "—" : <Link href="/dashboard/credit" className="hover:underline">{inr(owed[b]!)}</Link>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-3 text-[11px] text-on-dark-soft/70">
              Individual buyers are counted by walk-in customer (phone) or website account; anonymous walk-ins aren&apos;t counted.
            </p>
          </div>
        </div>
      </FilterBar>
    </div>
  );
}
