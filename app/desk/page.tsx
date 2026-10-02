import { ShoppingBag, School as SchoolIcon, Wallet, Globe, PackageX, Truck } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Desk — Dashboard" };

const LOW_STOCK = 3;

function fmt(paise: number) {
  const r = paise / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000)   return `₹${(r / 1000).toFixed(1)}K`;
  return `₹${r.toFixed(0)}`;
}

/** Midnight today in IST (UTC+5:30), as a UTC Date for Prisma comparisons. */
function startOfTodayIST(): Date {
  const offsetMs = 5.5 * 60 * 60 * 1000;
  const ist = new Date(Date.now() + offsetMs);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - offsetMs);
}

export default async function DeskDashboard() {
  const start = startOfTodayIST();
  const notCancelled = { status: { not: "cancelled" as const } };

  const [offlineToday, onlineToday, schoolToday, vendorToday, schoolCredit, vendorCredit, lowStock, recentSales, recentSchoolIssues, recentVendorIssues] =
    await Promise.all([
      db.order.aggregate({ _sum: { total: true }, _count: true, where: { channel: "offline", buyerType: "individual", ...notCancelled, createdAt: { gte: start } } }),
      db.order.aggregate({ _sum: { total: true }, _count: true, where: { channel: "online", ...notCancelled, createdAt: { gte: start } } }),
      db.order.aggregate({ _sum: { total: true }, _count: true, where: { buyerType: "school", ...notCancelled, createdAt: { gte: start } } }),
      db.order.aggregate({ _sum: { total: true }, _count: true, where: { buyerType: "vendor", ...notCancelled, createdAt: { gte: start } } }),
      // Only money owed counts as outstanding; advance credit (negative balance) is a liability, not a receivable.
      db.school.aggregate({ _sum: { balance: true }, where: { active: true, balance: { gt: 0 } } }),
      db.vendor.aggregate({ _sum: { balance: true }, where: { active: true, balance: { gt: 0 } } }),
      db.product.findMany({
        where: {
          OR: [
            { variants: { none: {} }, stock: { lte: LOW_STOCK } },
            { variants: { some: { stock: { lte: LOW_STOCK } } } },
          ],
        },
        select: { id: true, title: true, type: true, stock: true, variants: { select: { label: true, stock: true } } },
        orderBy: { stock: "asc" },
        take: 12,
      }),
      db.order.findMany({
        where: { channel: "offline", buyerType: "individual" },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { items: { take: 1, select: { title: true } }, _count: { select: { items: true } } },
      }),
      db.order.findMany({
        where: { buyerType: "school" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { school: { select: { name: true } }, items: { take: 1, select: { title: true } } },
      }),
      db.order.findMany({
        where: { buyerType: "vendor" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { vendor: { select: { name: true } }, items: { take: 1, select: { title: true } } },
      }),
    ]);

  const stats = [
    { label: "Offline today",        value: fmt(offlineToday._sum.total ?? 0), sub: `${offlineToday._count} sales`,   Icon: ShoppingBag },
    { label: "School issued today",  value: fmt(schoolToday._sum.total ?? 0),  sub: `${schoolToday._count} issues`,   Icon: SchoolIcon },
    { label: "Vendor issued today",  value: fmt(vendorToday._sum.total ?? 0),  sub: `${vendorToday._count} issues`,   Icon: Truck },
    { label: "Online today",         value: fmt(onlineToday._sum.total ?? 0),  sub: `${onlineToday._count} orders`,   Icon: Globe },
    { label: "School credit",        value: fmt(schoolCredit._sum.balance ?? 0), sub: "outstanding, active schools", Icon: Wallet },
    { label: "Vendor credit",        value: fmt(vendorCredit._sum.balance ?? 0), sub: "outstanding, active vendors", Icon: Wallet },
  ];

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Desk</h1>
          <p className="text-sm text-on-dark-soft mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link href="/desk/sales/new" className="h-9 px-4 bg-primary text-white text-sm font-medium rounded-md flex items-center gap-2 hover:bg-primary-active transition-colors">
          <ShoppingBag size={14} /> New Sale
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, sub, Icon }) => (
          <div key={label} className="bg-surface-dark-elevated rounded-xl p-5 border border-white/8">
            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-4">
              <Icon size={15} className="text-on-dark-soft" />
            </div>
            <p className="text-xl font-semibold text-on-dark">{value}</p>
            <p className="text-xs text-on-dark-soft mt-0.5">{label}</p>
            <p className="text-[11px] text-on-dark-soft/70 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent offline sales */}
        <div className="lg:col-span-2 bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
            <h2 className="text-sm font-medium text-on-dark">Recent Offline Sales</h2>
            <Link href="/desk/sales" className="text-xs text-primary hover:text-primary-active transition-colors">View all</Link>
          </div>
          {recentSales.length === 0 ? (
            <p className="text-sm text-on-dark-soft text-center py-8">No offline sales yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {["Ref", "Item", "Items", "Date", "Amount"].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentSales.map((o, i) => (
                  <tr key={o.id} className={`hover:bg-white/3 transition-colors ${i < recentSales.length - 1 ? "border-b border-white/8" : ""}`}>
                    <td className="px-6 py-3 font-mono text-xs text-on-dark-soft">#{o.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-3 text-xs text-on-dark-soft truncate max-w-[160px]">{o.items[0]?.title ?? "—"}</td>
                    <td className="px-6 py-3 text-xs text-on-dark-soft">{o._count.items}</td>
                    <td className="px-6 py-3 text-xs text-on-dark-soft">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </td>
                    <td className="px-6 py-3 text-on-dark font-medium">₹{(o.total / 100).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
              <h2 className="text-sm font-medium text-on-dark">Recent School Issues</h2>
              <Link href="/desk/schools" className="text-xs text-primary hover:text-primary-active transition-colors">Schools</Link>
            </div>
            <div className="px-5 py-3 flex flex-col gap-3">
              {recentSchoolIssues.length === 0 ? (
                <p className="text-xs text-on-dark-soft py-2">No issues yet.</p>
              ) : recentSchoolIssues.map(o => (
                <div key={o.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-on-dark truncate">{o.school?.name ?? "—"}</p>
                    <p className="text-[11px] text-on-dark-soft truncate">{o.items[0]?.title ?? "—"}</p>
                  </div>
                  <span className="text-xs text-on-dark font-medium shrink-0">₹{(o.total / 100).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
              <h2 className="text-sm font-medium text-on-dark">Recent Vendor Issues</h2>
              <Link href="/desk/vendors" className="text-xs text-primary hover:text-primary-active transition-colors">Vendors</Link>
            </div>
            <div className="px-5 py-3 flex flex-col gap-3">
              {recentVendorIssues.length === 0 ? (
                <p className="text-xs text-on-dark-soft py-2">No issues yet.</p>
              ) : recentVendorIssues.map(o => (
                <div key={o.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-on-dark truncate">{o.vendor?.name ?? "—"}</p>
                    <p className="text-[11px] text-on-dark-soft truncate">{o.items[0]?.title ?? "—"}</p>
                  </div>
                  <span className="text-xs text-on-dark font-medium shrink-0">₹{(o.total / 100).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
              <h2 className="text-sm font-medium text-on-dark">Low Stock</h2>
              <PackageX size={13} className="text-error" />
            </div>
            <div className="px-5 py-3 flex flex-col gap-3">
              {lowStock.length === 0 ? (
                <p className="text-xs text-success py-2">Nothing low.</p>
              ) : lowStock.map(p => {
                const qty = p.variants.length > 0
                  ? p.variants.reduce((s, v) => s + v.stock, 0)
                  : p.stock;
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-on-dark truncate">{p.title}</p>
                      <p className="text-[11px] text-on-dark-soft capitalize">{p.type}</p>
                    </div>
                    <span className={`text-xs font-medium shrink-0 ${qty <= 0 ? "text-error" : "text-warning"}`}>{qty} left</span>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-3 border-t border-white/8">
              <Link href="/desk/inventory" className="text-xs text-primary hover:text-primary-active transition-colors">Manage stock</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
