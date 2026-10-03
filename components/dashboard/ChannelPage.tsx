import Link from "next/link";
import FilterBar from "@/components/dashboard/FilterBar";
import StatTile from "@/components/dashboard/StatTile";
import ShareBars from "@/components/dashboard/ShareBars";
import ColumnChart from "@/components/dashboard/ColumnChart";
import ExportLinks from "@/components/dashboard/ExportLinks";
import { loadFacts, mainCategory, pctChange, summarize, summarizeAll, type MainCategory } from "@/lib/bi/facts";
import { customerActivity, modeLabel, paymentModes, staffPerformance } from "@/lib/bi/analytics";
import { productRowsOf } from "@/lib/bi/products";
import { CHANNEL_LABEL, GRAINS_LINKS, parseFilters, withFilters, type Channel, type SearchParams } from "@/lib/bi/filters";
import { buildTrend } from "@/lib/bi/trend";
import { inr } from "@/lib/bi/format";
import { VIZ } from "@/lib/bi/colors";
import { categoryOptions } from "@/lib/bi/categories";

/** Dedicated physical-store (§22) or website (§23) view: the sales page with the channel locked. */
export default async function ChannelPage({ channel, sp }: { channel: Channel; sp: SearchParams }) {
  const f = { ...parseFilters(sp), channel };
  const path = channel === "offline" ? "/dashboard/store" : "/dashboard/online";
  const [cur, prev, cats, staff, people] = await Promise.all([
    loadFacts(f, f.period.from, f.period.to),
    loadFacts(f, f.period.prevFrom, f.period.prevTo),
    categoryOptions(),
    channel === "offline" ? staffPerformance(f, f.period.from, f.period.to) : Promise.resolve([]),
    channel === "online" ? customerActivity(f, f.period.from, f.period.to, f.period.prevFrom) : Promise.resolve(null),
  ]);
  const S = summarizeAll(cur), P = summarizeAll(prev);
  const unit = channel === "offline" ? "bill" : "order";
  const mains = (["Books", "Gifts", "Other"] as MainCategory[]).map((m) => ({
    m, s: summarize(cur.lines.filter((l) => mainCategory(l.type) === m), cur.returns.filter((r) => mainCategory(r.type) === m), cur.orders, [], true),
  }));
  const modes = paymentModes({ ...cur, settlements: channel === "offline" ? cur.settlements : [] });
  const top = productRowsOf(cur).filter((p) => p.qty > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  const web = people?.rows.filter((r) => r.source === "Website") ?? [];

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">{channel === "offline" ? "Physical store" : "Online sales"}</h1>
          <p className="text-sm text-on-dark-soft mt-0.5 mb-5">{f.period.label} · {CHANNEL_LABEL[channel]} only · vs previous period</p>
        </div>
        <ExportLinks id={channel === "offline" ? "store-sales" : "online-sales"} sp={sp} />
      </div>
      <FilterBar categories={cats} showChannel={false}>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6" data-testid="channel-tiles">
          <StatTile label="Net sales" value={inr(S.net)} delta={pctChange(S.net, P.net)} emphasis href={withFilters("/dashboard/transactions", sp, { channel })} />
          <StatTile label={channel === "offline" ? "Bills" : "Orders"} value={String(S.transactions)} delta={pctChange(S.transactions, P.transactions)} />
          <StatTile label={`Avg ${unit}`} value={inr(S.avg)} delta={pctChange(S.avg, P.avg)} />
          <StatTile label="Units sold" value={String(S.qty)} delta={pctChange(S.qty, P.qty)} />
          <StatTile label="Discount" value={inr(S.discount)} upIsGood={false} delta={pctChange(S.discount, P.discount)} />
          <StatTile label="Collected" value={S.categoryScoped ? "—" : inr(S.collected)} sub={S.categoryScoped ? "n/a with a category filter" : undefined} />
        </div>
        <div className="flex items-center gap-1 mb-3">
          {GRAINS_LINKS.map(([g, label]) => (
            <Link key={g} href={withFilters(path, sp, { grain: g })}
              className={`px-3 h-7 inline-flex items-center text-xs rounded-md ${f.grain === g ? "bg-white/10 text-on-dark" : "text-on-dark-soft hover:text-on-dark"}`}>{label}</Link>
          ))}
        </div>
        <div className="mb-6"><ColumnChart title={`${channel === "offline" ? "Store" : "Website"} net sales over time`} columns={buildTrend(cur, f.period.from, f.period.to, f.grain)} valueName="net sales" /></div>
        <div className="grid lg:grid-cols-3 gap-6">
          <ShareBars title="Sales by category" rows={mains.map(({ m, s }) => ({ key: m, label: m, value: s.net, valueText: inr(s.net), color: VIZ.main[m], sub: `${s.qty} units` }))} />
          <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
            <h2 className="px-5 py-3.5 border-b border-white/8 text-sm font-medium text-on-dark">Payment modes</h2>
            {modes.length === 0 ? <p className="text-sm text-on-dark-soft text-center py-6">No payments.</p> : modes.map((m) => (
              <p key={m.method} className="flex justify-between px-5 py-2 text-sm border-b border-white/5"><span className="text-on-dark">{modeLabel(m.method)}</span><span className="text-on-dark-soft tabular-nums">{m.transactions} · {inr(m.amount)}</span></p>
            ))}
          </div>
          {channel === "offline" ? (
            <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden" data-testid="store-staff">
              <h2 className="px-5 py-3.5 border-b border-white/8 text-sm font-medium text-on-dark">Sales by employee</h2>
              {staff.length === 0 ? <p className="text-sm text-on-dark-soft text-center py-6">No desk activity.</p> : staff.map((r) => (
                <p key={r.key} className="flex justify-between px-5 py-2 text-sm border-b border-white/5"><span className="text-on-dark">{r.name}</span><span className="text-on-dark-soft tabular-nums">{r.transactions} · {inr(r.sales)}</span></p>
              ))}
            </div>
          ) : (
            <div className="bg-surface-dark-elevated rounded-xl border border-white/8 p-5" data-testid="online-customers">
              <h2 className="text-sm font-medium text-on-dark mb-3">Customer activity</h2>
              <p className="text-sm text-on-dark-soft">Accounts that bought: <span className="text-on-dark">{web.filter((r) => r.periodValue > 0).length}</span></p>
              <p className="text-sm text-on-dark-soft">New customers: <span className="text-on-dark">{web.filter((r) => r.segments.includes("new")).length}</span></p>
              <p className="text-sm text-on-dark-soft">Repeat customers: <span className="text-on-dark">{web.filter((r) => r.segments.includes("repeat")).length}</span></p>
              <Link href="/dashboard/customers?channel=online" className="text-xs text-primary mt-3 inline-block">All customers →</Link>
            </div>
          )}
        </div>
        <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden mt-6">
          <h2 className="px-5 py-3.5 border-b border-white/8 text-sm font-medium text-on-dark">Products sold</h2>
          {top.length === 0 ? <p className="text-sm text-on-dark-soft text-center py-6">Nothing sold.</p> : (
            <table className="w-full text-sm"><tbody className="tabular-nums">{top.map((p) => (
              <tr key={p.productId} className="border-b border-white/5"><td className="px-5 py-2 text-on-dark">{p.title}</td><td className="px-5 py-2 text-on-dark-soft">{p.qty} units</td><td className="px-5 py-2 text-on-dark">{inr(p.revenue)}</td></tr>
            ))}</tbody></table>
          )}
        </div>
      </FilterBar>
    </div>
  );
}
