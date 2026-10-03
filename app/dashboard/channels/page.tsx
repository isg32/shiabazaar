import type { Metadata } from "next";
import Link from "next/link";
import FilterBar from "@/components/dashboard/FilterBar";
import ShareBars from "@/components/dashboard/ShareBars";
import { loadFacts, summarize } from "@/lib/bi/facts";
import { CHANNEL_LABEL, parseFilters, withFilters, type Channel, type SearchParams } from "@/lib/bi/filters";
import { inr } from "@/lib/bi/format";
import { VIZ } from "@/lib/bi/colors";
import { categoryOptions } from "@/lib/bi/categories";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Online vs store" };

export default async function Channels({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const [facts, cats] = await Promise.all([loadFacts(f, f.period.from, f.period.to), categoryOptions()]);

  const rows = (["online", "offline"] as Channel[]).map((ch) => {
    const s = summarize(
      facts.lines.filter((l) => l.channel === ch),
      facts.returns.filter((r) => r.channel === ch),
      facts.orders,
      ch === "offline" ? facts.settlements : [],
      facts.categoryScoped,
    );
    return { ch, s };
  });
  const dash = (v: string) => (facts.categoryScoped ? "—" : v);

  return (
    <div className="px-8 py-8 text-on-dark">
      <h1 className="text-2xl font-semibold text-on-dark">Online vs store</h1>
      <p className="text-sm text-on-dark-soft mt-0.5 mb-5">{f.period.label}</p>
      <FilterBar categories={cats}>
        <div className="grid lg:grid-cols-3 gap-6">
          <ShareBars title="Share of net sales" rows={rows.map(({ ch, s }) => ({
            key: ch, label: CHANNEL_LABEL[ch], value: s.net, valueText: inr(s.net), color: VIZ.channel[ch],
            sub: `${s.transactions} transactions`, href: withFilters("/dashboard/transactions", sp, { channel: ch }),
          }))} />
          <div className="lg:col-span-2 bg-surface-dark-elevated rounded-xl border border-white/8 overflow-x-auto">
            <table className="w-full text-sm" data-testid="channel-table">
              <thead>
                <tr className="border-b border-white/8">
                  {["Channel", "Net sales", "Transactions", "Avg order", "Gross", "Discount", "Returns", "Collected", "Credit"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {rows.map(({ ch, s }) => (
                  <tr key={ch} className="border-b border-white/5">
                    <td className="px-4 py-3">
                      <Link href={withFilters("/dashboard/transactions", sp, { channel: ch })} className="flex items-center gap-2 text-on-dark hover:underline">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: VIZ.channel[ch] }} />{CHANNEL_LABEL[ch]}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-on-dark font-medium">{inr(s.net)}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{s.transactions}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{inr(s.avg)}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{inr(s.gross)}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{inr(s.discount)}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{inr(s.returns)}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{dash(inr(s.collected))}</td>
                    <td className="px-4 py-3 text-on-dark-soft">{dash(inr(s.creditGenerated))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-4 py-3 text-[11px] text-on-dark-soft/70">
              Store collections include school/vendor settlements received in the period. Online sales count once paid.
            </p>
          </div>
        </div>
      </FilterBar>
    </div>
  );
}
