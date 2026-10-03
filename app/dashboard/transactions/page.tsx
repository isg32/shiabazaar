import type { Metadata } from "next";
import Link from "next/link";
import FilterBar from "@/components/dashboard/FilterBar";
import { db } from "@/lib/db";
import { BUYER_LABEL, CHANNEL_LABEL, parseFilters, withFilters, type SearchParams } from "@/lib/bi/filters";
import { inr } from "@/lib/bi/format";
import { categoryOptions } from "@/lib/bi/categories";
import { buyerName, orderWhere } from "@/lib/bi/orders";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Transactions" };

const PAGE = 50;

export default async function Transactions({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const page = Math.max(1, Number(Array.isArray(sp.page) ? sp.page[0] : sp.page) || 1);
  const where = await orderWhere(f);

  const [count, orders, cats] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      select: {
        id: true, createdAt: true, channel: true, buyerType: true, status: true,
        subtotal: true, discountAmount: true, total: true, amountPaid: true, paymentMethod: true,
        school: { select: { name: true, code: true } },
        vendor: { select: { name: true, code: true } },
        customer: { select: { name: true, phone: true } },
        user: { select: { name: true, email: true } },
        items: { select: { qty: true, price: true, mrp: true } },
        returns: { select: { amount: true } },
      },
    }),
    categoryOptions(),
  ]);
  const pages = Math.max(1, Math.ceil(count / PAGE));

  return (
    <div className="px-8 py-8 text-on-dark">
      <h1 className="text-2xl font-semibold text-on-dark">Transactions</h1>
      <p className="text-sm text-on-dark-soft mt-0.5 mb-5">{f.period.label} · {count} transactions</p>
      <FilterBar categories={cats}>
        <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-x-auto">
          <table className="w-full text-sm" data-testid="tx-table">
            <thead>
              <tr className="border-b border-white/8">
                {["Date", "Ref", "Channel", "Buyer", "Items", "Gross", "Discount", "Net", "Paid", "Credit", "Returned"].map((h) => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {orders.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-10 text-center text-on-dark-soft">No transactions match these filters.</td></tr>
              ) : orders.map((o) => {
                const gross = o.items.reduce((s, i) => s + (i.mrp ?? i.price) * i.qty, 0);
                const net = o.subtotal - o.discountAmount;
                const returned = o.returns.reduce((s, r) => s + r.amount, 0);
                const credit = o.buyerType === "individual" ? 0 : o.total - o.amountPaid;
                return (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/3">
                    <td className="px-3 py-2.5 text-xs text-on-dark-soft whitespace-nowrap">
                      {o.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href={`/dashboard/transactions/${o.id}`} className="font-mono text-xs text-primary hover:text-primary-active">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-on-dark-soft">{CHANNEL_LABEL[o.channel]}</td>
                    <td className="px-3 py-2.5 text-xs">
                      <span className="text-on-dark">{buyerName(o)}</span>
                      <span className="block text-[11px] text-on-dark-soft">{BUYER_LABEL[o.buyerType]}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-on-dark-soft">{o.items.reduce((s, i) => s + i.qty, 0)}</td>
                    <td className="px-3 py-2.5 text-xs text-on-dark-soft">{inr(gross)}</td>
                    <td className="px-3 py-2.5 text-xs text-on-dark-soft">{gross - net ? inr(gross - net) : "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-on-dark font-medium">{inr(net)}</td>
                    <td className="px-3 py-2.5 text-xs text-on-dark-soft">{inr(o.amountPaid)}</td>
                    <td className="px-3 py-2.5 text-xs text-on-dark-soft">{credit > 0 ? inr(credit) : credit < 0 ? `${inr(-credit)} adv` : "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-on-dark-soft">{returned ? inr(returned) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pages > 1 && (
          <div className="flex items-center justify-between mt-4 text-xs text-on-dark-soft">
            <span>Page {page} of {pages}</span>
            <div className="flex gap-2">
              {page > 1 && <Link href={withFilters("/dashboard/transactions", sp, { page: String(page - 1) })} className="px-3 h-7 inline-flex items-center rounded-md bg-white/5 hover:bg-white/10">Previous</Link>}
              {page < pages && <Link href={withFilters("/dashboard/transactions", sp, { page: String(page + 1) })} className="px-3 h-7 inline-flex items-center rounded-md bg-white/5 hover:bg-white/10">Next</Link>}
            </div>
          </div>
        )}
      </FilterBar>
    </div>
  );
}
