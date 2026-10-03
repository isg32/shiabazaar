import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { db } from "@/lib/db";
import { BUYER_LABEL, CHANNEL_LABEL } from "@/lib/bi/filters";
import { inr } from "@/lib/bi/format";
import { buyerName } from "@/lib/bi/orders";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Transaction" };

export default async function TransactionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const o = await db.order.findUnique({
    where: { id },
    include: {
      school: { select: { id: true, name: true, code: true } },
      vendor: { select: { id: true, name: true, code: true } },
      customer: { select: { name: true, phone: true } },
      user: { select: { name: true, email: true } },
      items: { include: { returnLines: { select: { qty: true } } } },
      payments: true,
      returns: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!o) notFound();
  const staffIds = [o.recordedById, o.creditOverrideById].filter(Boolean) as string[];
  const staff = staffIds.length ? await db.user.findMany({ where: { id: { in: staffIds } }, select: { id: true, name: true, email: true } }) : [];
  const who = (uid: string | null) => { const u = staff.find((s) => s.id === uid); return u ? u.name || u.email : "—"; };
  const gross = o.items.reduce((s, i) => s + (i.mrp ?? i.price) * i.qty, 0);
  const net = o.subtotal - o.discountAmount;
  const returned = o.returns.reduce((s, r) => s + r.amount, 0);
  const account = o.school ? { kind: "school", ...o.school } : o.vendor ? { kind: "vendor", ...o.vendor } : null;
  const fact = (k: string, v: React.ReactNode) => (
    <div><p className="text-[11px] uppercase tracking-wide text-on-dark-soft">{k}</p><p className="text-sm text-on-dark mt-0.5">{v}</p></div>
  );

  return (
    <div className="px-8 py-8 text-on-dark max-w-5xl">
      <Link href="/dashboard/transactions" className="inline-flex items-center gap-1 text-xs text-on-dark-soft hover:text-on-dark mb-4">
        <ChevronLeft size={13} /> Transactions
      </Link>
      <h1 className="text-2xl font-semibold text-on-dark">
        Transaction <span className="font-mono text-base text-on-dark-soft">#{o.id.slice(0, 8).toUpperCase()}</span>
        {o.status === "cancelled" && <span className="ml-3 text-xs px-2 py-0.5 rounded-full bg-error/15 text-error align-middle">Cancelled</span>}
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface-dark-elevated rounded-xl border border-white/8 p-5 my-6" data-testid="tx-facts">
        {fact("Date", o.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }))}
        {fact("Channel", CHANNEL_LABEL[o.channel])}
        {fact("Buyer", <>{account ? <Link className="text-primary hover:text-primary-active" href={`/dashboard/accounts/${account.kind}/${account.id}`}>{buyerName(o)}</Link> : buyerName(o)} <span className="text-on-dark-soft">· {BUYER_LABEL[o.buyerType]}</span></>)}
        {fact("Entered by", o.recordedById ? who(o.recordedById) : o.channel === "online" ? "Website checkout" : "—")}
        {fact("Gross (MRP)", inr(gross))}
        {fact("Discount", inr(gross - net))}
        {fact("Net", inr(net))}
        {fact("Paid at sale", inr(o.amountPaid))}
        {o.shippingAmount > 0 && fact("Shipping", inr(o.shippingAmount))}
        {o.buyerType !== "individual" && fact("Credit generated", inr(Math.max(o.total - o.amountPaid, 0)))}
        {returned > 0 && fact("Returned", inr(returned))}
        {o.creditOverrideById && fact("Credit limit override", `approved by ${who(o.creditOverrideById)}`)}
      </div>

      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden mb-6">
        <h2 className="px-5 py-4 border-b border-white/8 text-sm font-medium text-on-dark">Items</h2>
        <table className="w-full text-sm" data-testid="tx-items">
          <thead>
            <tr className="border-b border-white/8">
              {["Item", "Qty", "MRP", "Disc %", "Price", "Line total", "Returned"].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {o.items.map((i) => {
              const mrp = i.mrp ?? i.price;
              const rq = i.returnLines.reduce((s, r) => s + r.qty, 0);
              return (
                <tr key={i.id} className="border-b border-white/5">
                  <td className="px-4 py-2.5 text-on-dark">{i.title}</td>
                  <td className="px-4 py-2.5 text-on-dark-soft">{i.qty}</td>
                  <td className="px-4 py-2.5 text-on-dark-soft">{inr(mrp)}</td>
                  <td className="px-4 py-2.5 text-on-dark-soft">{mrp ? Math.round((1 - i.price / mrp) * 1000) / 10 : 0}%</td>
                  <td className="px-4 py-2.5 text-on-dark-soft">{inr(i.price)}</td>
                  <td className="px-4 py-2.5 text-on-dark">{inr(i.price * i.qty)}</td>
                  <td className="px-4 py-2.5 text-on-dark-soft">{rq || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {o.discountAmount > 0 && <p className="px-4 py-3 text-xs text-on-dark-soft">Bill discount {inr(o.discountAmount)}{o.couponCode ? ` (coupon ${o.couponCode})` : ""}</p>}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-surface-dark-elevated rounded-xl border border-white/8 p-5">
          <h2 className="text-sm font-medium text-on-dark mb-3">Payments at sale</h2>
          {o.payments.length === 0 ? <p className="text-sm text-on-dark-soft">None — fully on credit.</p> : o.payments.map((p) => (
            <p key={p.id} className="flex justify-between text-sm py-1"><span className="capitalize text-on-dark-soft">{p.method.replace(/_/g, " ")}</span><span className="text-on-dark tabular-nums">{inr(p.amount)}</span></p>
          ))}
        </div>
        <div className="bg-surface-dark-elevated rounded-xl border border-white/8 p-5">
          <h2 className="text-sm font-medium text-on-dark mb-3">Returns</h2>
          {o.returns.length === 0 ? <p className="text-sm text-on-dark-soft">None.</p> : o.returns.map((r) => (
            <p key={r.id} className="flex justify-between text-sm py-1">
              <span className="text-on-dark-soft">{r.createdAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" })}{r.note ? ` · ${r.note}` : ""}</span>
              <span className="text-on-dark tabular-nums">{inr(r.amount)}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
