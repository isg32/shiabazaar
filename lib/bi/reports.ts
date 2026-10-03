import { db } from "@/lib/db";
import { buildStatement } from "@/lib/statement";
import { loadFacts, summarize, summarizeAll, mainCategory, type Facts, type MainCategory } from "./facts";
import { BUYER_LABEL, CHANNEL_LABEL, type Buyer, type Channel, type DashFilters } from "./filters";
import { bucketSummaries } from "./trend";
import { productRowsOf } from "./products";
import { BUCKETS, inactiveAccounts, loadAccounts, STATUS_LABEL, type Kind } from "./credit";
import {
  buyerNames, cancellations, customerActivity, discountTransactions, institutionPerformance, modeLabel,
  orderTotals, paymentModes, SEGMENT_LABEL, staffPerformance,
} from "./analytics";
import type { Col, Row } from "./export";

/*
 * The report library (TM spec §30). Each report is computed from the same
 * datasets as the dashboard pages and scoped by the global filters.
 */

export type ReportDef = {
  id: string;
  title: string;
  group: "Sales" | "Customers" | "Products" | "Credit" | "Collections" | "Operations";
  description: string;
  /** Ignores the date range (point-in-time snapshot). */
  snapshot?: boolean;
  build: (f: DashFilters) => Promise<{ cols: Col[]; rows: Row[] }>;
};

const c = (key: string, label: string, type: Col["type"] = "text"): Col => ({ key, label, type });
const facts = (f: DashFilters, over: Partial<DashFilters> = {}) => {
  const g = { ...f, ...over };
  return loadFacts(g, g.period.from, g.period.to);
};
const pct1 = (a: number, b: number) => (b ? Math.round((a / b) * 1000) / 10 : 0);

const BUCKET_COLS = [
  c("period", "Period", "date"), c("transactions", "Transactions", "int"), c("gross", "Gross (MRP)", "money"),
  c("discount", "Discount", "money"), c("returns", "Returns", "money"), c("net", "Net sales", "money"),
  c("collected", "Collected", "money"), c("credit", "Credit generated", "money"),
];
async function bucketReport(f: DashFilters, grain: "day" | "month", over: Partial<DashFilters> = {}) {
  const fx = await facts(f, over);
  return {
    cols: BUCKET_COLS,
    rows: bucketSummaries(fx, f.period.from, f.period.to, grain).map(({ start, s }) => ({
      period: start, transactions: s.transactions, gross: s.gross, discount: s.discount, returns: s.returns,
      net: s.net, collected: fx.categoryScoped ? null : s.collected, credit: fx.categoryScoped ? null : s.creditGenerated,
    })),
  };
}

const SEGMENT_COLS = [
  c("name", "Name"), c("transactions", "Transactions", "int"), c("net", "Net sales", "money"), c("avg", "Avg order", "money"),
  c("gross", "Gross (MRP)", "money"), c("discount", "Discount", "money"), c("returns", "Returns", "money"),
  c("collected", "Collected", "money"), c("credit", "Credit generated", "money"), c("share", "Share %", "pct"),
];
function segmentRows(fx: Facts, keys: string[], label: (k: string) => string, pick: (x: { channel: Channel; buyer: Buyer }) => string) {
  const total = summarizeAll(fx).net;
  return keys.map((k) => {
    // Settlements are school/vendor money received in the store: they belong to "offline", "school" or "vendor".
    const settled = fx.settlements.filter((p) => k === "offline" || k === p.kind);
    const s = summarize(fx.lines.filter((l) => pick(l) === k), fx.returns.filter((r) => pick(r) === k), fx.orders, settled, fx.categoryScoped);
    return { name: label(k), transactions: s.transactions, net: s.net, avg: s.avg, gross: s.gross, discount: s.discount, returns: s.returns,
      collected: fx.categoryScoped ? null : s.collected, credit: fx.categoryScoped ? null : s.creditGenerated, share: pct1(s.net, total) };
  });
}

async function institutionReport(kind: Kind, f: DashFilters, top = false) {
  const rows = await institutionPerformance(kind, f, f.period.from, f.period.to);
  const list = top ? rows.filter((r) => r.sales > 0).sort((a, b) => b.sales - a.sales) : rows.sort((a, b) => b.sales - a.sales);
  return {
    cols: [
      ...(top ? [c("rank", "Rank", "int")] : []),
      c("code", "Code"), c("name", "Name"), c("city", "City"), c("state", "State"), c("transactions", "Transactions", "int"),
      c("sales", "Net sales", "money"), c("avg", "Avg order", "money"), c("highest", "Highest order", "money"),
      c("discount", "Discount", "money"), c("paid", "Paid in period", "money"), c("limit", "Credit limit", "money"),
      c("outstanding", "Outstanding now", "money"), c("status", "Credit status"), c("lastOrder", "Last order", "date"), c("segments", "Segments"),
    ],
    rows: list.map((r, i) => ({
      rank: i + 1, code: r.account.code, name: r.account.name, city: r.account.city, state: r.account.state,
      transactions: r.transactions, sales: r.sales, avg: r.avg, highest: r.highest, discount: r.discount, paid: r.paidInPeriod,
      limit: r.account.creditLimit || null, outstanding: r.account.balance, status: STATUS_LABEL[r.account.status],
      lastOrder: r.lastOrder, segments: r.segments.map((s) => SEGMENT_LABEL[s]).join(", "),
    })),
  };
}

async function creditReport(kind: Kind | undefined, onlyOwed = false) {
  const { accounts } = await loadAccounts(kind);
  return {
    cols: [
      c("code", "Code"), c("name", "Name"), c("type", "Type"), c("city", "City"), c("limit", "Credit limit", "money"),
      c("outstanding", "Outstanding", "money"), c("available", "Available", "money"), c("utilisation", "Utilisation %", "pct"),
      c("status", "Status"), c("overdue", "Overdue", "money"), c("days", "Days outstanding", "int"), c("terms", "Terms (days)", "int"),
      c("lastPayment", "Last payment", "date"), c("lastSale", "Last sale", "date"),
    ],
    rows: accounts.filter((a) => !onlyOwed || a.balance > 0).sort((a, b) => b.balance - a.balance).map((a) => ({
      code: a.code, name: a.name, type: a.kind === "school" ? "School" : "Vendor", city: a.city, limit: a.creditLimit || null,
      outstanding: a.balance, available: a.available, utilisation: a.utilisation, status: STATUS_LABEL[a.status], overdue: a.overdue,
      days: a.open.length ? a.daysOutstanding : null, terms: a.termsDays, lastPayment: a.lastPayment, lastSale: a.lastSale,
    })),
  };
}

async function inactiveAccountReport(kind: Kind) {
  const { accounts, settings } = await loadAccounts(kind);
  const rows = inactiveAccounts(accounts, settings.inactiveDays).map(({ a, days }) => ({ a, idle: days }));
  return {
    cols: [c("code", "Code"), c("name", "Name"), c("city", "City"), c("lastSale", "Last sale", "date"), c("days", "Days since last sale", "int"), c("outstanding", "Outstanding", "money")],
    rows: rows.map(({ a, idle }) => ({ code: a.code, name: a.name, city: a.city, lastSale: a.lastSale, days: idle, outstanding: a.balance })),
  };
}

export const REPORTS: ReportDef[] = [
  { id: "daily-sales", title: "Daily sales report", group: "Sales", description: "Transactions, gross, discount, returns, net, collected and credit per day.", build: (f) => bucketReport(f, "day") },
  { id: "monthly-sales", title: "Monthly sales report", group: "Sales", description: "The same metrics per month.", build: (f) => bucketReport(f, "month") },
  {
    id: "sales-by-channel", title: "Sales by channel", group: "Sales", description: "Website vs physical store.",
    build: async (f) => ({ cols: SEGMENT_COLS, rows: segmentRows(await facts(f), ["online", "offline"], (k) => CHANNEL_LABEL[k as Channel], (x) => x.channel) }),
  },
  {
    id: "sales-by-buyer", title: "Sales by buyer type", group: "Sales", description: "Individual vs school vs vendor.",
    build: async (f) => ({ cols: SEGMENT_COLS, rows: segmentRows(await facts(f), ["individual", "school", "vendor"], (k) => BUYER_LABEL[k as Buyer], (x) => x.buyer) }),
  },
  { id: "store-sales", title: "Physical store report", group: "Sales", description: "Daily store sales (all desk entries).", build: (f) => bucketReport(f, "day", { channel: "offline" }) },
  { id: "online-sales", title: "Online sales report", group: "Sales", description: "Daily website sales (paid orders).", build: (f) => bucketReport(f, "day", { channel: "online" }) },
  {
    id: "transactions", title: "Complete transaction report", group: "Sales", description: "Every transaction with buyer, value, payment, credit and returns.",
    build: async (f) => {
      const fx = await facts(f);
      const totals = orderTotals(fx);
      const ids = [...fx.orders.keys()];
      const [names, extra] = await Promise.all([
        buyerNames(ids),
        ids.length ? db.order.findMany({ where: { id: { in: ids } }, select: { id: true, paymentMethod: true, shippingAmount: true } }) : [],
      ]);
      const staff = await db.user.findMany({ where: { id: { in: [...new Set([...fx.orders.values()].map((o) => o.recordedById).filter(Boolean) as string[])] } }, select: { id: true, name: true, email: true } });
      const ret = new Map<string, number>();
      for (const r of fx.returns) ret.set(r.orderId, (ret.get(r.orderId) ?? 0) + r.amount);
      return {
        cols: [c("date", "Date", "date"), c("ref", "Ref"), c("channel", "Channel"), c("buyerType", "Buyer type"), c("buyer", "Buyer"),
          c("qty", "Units", "int"), c("gross", "Gross (MRP)", "money"), c("discount", "Discount", "money"), c("net", "Net", "money"),
          c("paid", "Paid at sale", "money"), c("credit", "Credit generated", "money"), c("returned", "Returned", "money"),
          c("payment", "Payment mode"), c("by", "Entered by")],
        rows: [...fx.orders.values()].sort((a, b) => b.at.getTime() - a.at.getTime()).map((o) => {
          const t = totals.get(o.id)!;
          const u = staff.find((s) => s.id === o.recordedById);
          return {
            date: o.at, ref: o.id.slice(0, 8).toUpperCase(), channel: CHANNEL_LABEL[o.channel], buyerType: BUYER_LABEL[o.buyer], buyer: names.get(o.id) ?? "",
            qty: t.qty, gross: t.gross, discount: t.gross - t.net, net: t.net, paid: o.amountPaid,
            credit: o.buyer === "individual" ? null : Math.max(o.total - o.amountPaid, 0), returned: ret.get(o.id) ?? null,
            payment: (() => { const m = extra.find((e) => e.id === o.id)?.paymentMethod ?? (o.channel === "online" ? "online" : null); return m ? modeLabel(m) : "On credit"; })(),
            by: o.channel === "online" ? "Website checkout" : u?.name || u?.email || "",
          };
        }),
      };
    },
  },
  { id: "school-sales", title: "School-wise sales", group: "Customers", description: "Sales, orders, paid and outstanding per school, with segments.", build: (f) => institutionReport("school", f) },
  { id: "vendor-sales", title: "Vendor-wise sales", group: "Customers", description: "Sales, orders, paid and outstanding per vendor, with segments.", build: (f) => institutionReport("vendor", f) },
  { id: "top-schools", title: "Top schools", group: "Customers", description: "Schools ranked by net sales in the period.", build: (f) => institutionReport("school", f, true) },
  { id: "top-vendors", title: "Top vendors", group: "Customers", description: "Vendors ranked by net sales in the period.", build: (f) => institutionReport("vendor", f, true) },
  {
    id: "customer-sales", title: "Individual customer sales", group: "Customers", description: "Walk-in customers (by phone) and website accounts: activity and segment.",
    build: async (f) => {
      const { rows } = await customerActivity(f, f.period.from, f.period.to, f.period.prevFrom);
      return {
        cols: [c("name", "Customer"), c("contact", "Phone / email"), c("source", "Source"), c("period", "Purchases in period", "money"),
          c("purchases", "Purchases (all time)", "int"), c("total", "Total value", "money"), c("avg", "Avg purchase", "money"),
          c("first", "First purchase", "date"), c("last", "Last purchase", "date"), c("days", "Days since last", "int"), c("segments", "Segments")],
        rows: rows.sort((a, b) => b.periodValue - a.periodValue || b.total - a.total).map((r) => ({
          name: r.name, contact: r.contact, source: r.source, period: r.periodValue, purchases: r.purchases, total: r.total, avg: r.avg,
          first: r.first, last: r.last, days: r.daysSince, segments: r.segments.join(", "),
        })),
      };
    },
  },
  {
    id: "inactive-customers", title: "Inactive customer report", group: "Customers", snapshot: true, description: "Individual customers with no purchase within the inactivity period.",
    build: async (f) => {
      const { rows, inactiveDays } = await customerActivity(f, f.period.from, f.period.to, f.period.prevFrom);
      return {
        cols: [c("name", "Customer"), c("contact", "Phone / email"), c("source", "Source"), c("last", "Last purchase", "date"), c("days", `Days since last (> ${inactiveDays})`, "int"), c("purchases", "Purchases", "int"), c("total", "Total value", "money")],
        rows: rows.filter((r) => r.segments.includes("inactive")).sort((a, b) => b.daysSince - a.daysSince).map((r) => ({ name: r.name, contact: r.contact, source: r.source, last: r.last, days: r.daysSince, purchases: r.purchases, total: r.total })),
      };
    },
  },
  { id: "inactive-schools", title: "Inactive school report", group: "Customers", snapshot: true, description: "Active schools with no sale within the inactivity period.", build: () => inactiveAccountReport("school") },
  { id: "inactive-vendors", title: "Inactive vendor report", group: "Customers", snapshot: true, description: "Active vendors with no sale within the inactivity period.", build: () => inactiveAccountReport("vendor") },
  {
    id: "staff-performance", title: "User / salesperson performance", group: "Customers", description: "Entries, sales, discounts, credit and collections per staff member.",
    build: async (f) => ({
      cols: [c("name", "Entered by"), c("transactions", "Transactions", "int"), c("sales", "Net sales", "money"), c("avg", "Avg transaction", "money"), c("discount", "Discounts given", "money"), c("credit", "Credit generated", "money"), c("collected", "Collections recorded", "money")],
      rows: (await staffPerformance(f, f.period.from, f.period.to)).map((r) => ({ name: r.name, transactions: r.transactions, sales: r.sales, avg: r.avg, discount: r.discount, credit: r.creditGenerated, collected: r.collected })),
    }),
  },
  {
    id: "product-sales", title: "Product-wise sales", group: "Products", description: "Quantity, gross, discount, returns and revenue per product.",
    build: async (f) => ({
      cols: [c("sku", "SKU"), c("title", "Product"), c("main", "Main category"), c("qty", "Qty", "int"), c("gross", "Gross (MRP)", "money"), c("discount", "Discount", "money"), c("returnedQty", "Returned qty", "int"), c("returns", "Returns", "money"), c("revenue", "Revenue", "money")],
      rows: productRowsOf(await facts(f)).sort((a, b) => b.revenue - a.revenue).map((r) => ({ ...r })),
    }),
  },
  {
    id: "top-products", title: "Top products report", group: "Products", description: "The 50 best-selling products by revenue.",
    build: async (f) => ({
      cols: [c("rank", "Rank", "int"), c("sku", "SKU"), c("title", "Product"), c("main", "Main category"), c("qty", "Qty", "int"), c("revenue", "Revenue", "money")],
      rows: productRowsOf(await facts(f)).filter((r) => r.qty > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 50).map((r, i) => ({ rank: i + 1, ...r })),
    }),
  },
  {
    id: "category-sales", title: "Category-wise sales", group: "Products", description: "Books / Gifts / Other.",
    build: async (f) => {
      const fx = await facts(f);
      const total = summarizeAll(fx).net;
      return {
        cols: [c("name", "Main category"), c("qty", "Qty", "int"), c("transactions", "Transactions", "int"), c("gross", "Gross (MRP)", "money"), c("discount", "Discount", "money"), c("returns", "Returns", "money"), c("net", "Net sales", "money"), c("share", "Contribution %", "pct")],
        rows: (["Books", "Gifts", "Other"] as MainCategory[]).map((m) => {
          const s = summarize(fx.lines.filter((l) => mainCategory(l.type) === m), fx.returns.filter((r) => mainCategory(r.type) === m), fx.orders, [], true);
          return { name: m, qty: s.qty, transactions: s.transactions, gross: s.gross, discount: s.discount, returns: s.returns, net: s.net, share: pct1(s.net, total) };
        }),
      };
    },
  },
  {
    id: "subcategory-sales", title: "Subcategory-wise sales", group: "Products", description: "Every category and subcategory (a product tagged in several counts in each).",
    build: async (f) => {
      const fx = await facts(f);
      const ids = [...new Set(fx.lines.map((l) => l.productId))];
      const [cats, links] = await Promise.all([
        db.category.findMany({ select: { id: true, name: true, parentId: true } }),
        ids.length ? db.productCategory.findMany({ where: { productId: { in: ids } }, select: { productId: true, categoryId: true } }) : [],
      ]);
      const byId = new Map(cats.map((x) => [x.id, x]));
      const path = (id: string): string => { const x = byId.get(id)!; return x.parentId ? `${path(x.parentId)} › ${x.name}` : x.name; };
      // Subtrees from the one category list — never a query per category.
      const kids = new Map<string, string[]>();
      for (const x of cats) if (x.parentId) kids.set(x.parentId, [...(kids.get(x.parentId) ?? []), x.id]);
      const subtree = (id: string): string[] => [id, ...(kids.get(id) ?? []).flatMap(subtree)];
      const rows = cats.map((cat) => {
        const sub = new Set(subtree(cat.id));
        const prods = new Set(links.filter((l) => sub.has(l.categoryId)).map((l) => l.productId));
        const s = summarize(fx.lines.filter((l) => prods.has(l.productId)), fx.returns.filter((r) => prods.has(r.productId)), fx.orders, [], true);
        return { name: path(cat.id), qty: s.qty, transactions: s.transactions, gross: s.gross, discount: s.discount, returns: s.returns, net: s.net };
      });
      return {
        cols: [c("name", "Category"), c("qty", "Qty", "int"), c("transactions", "Transactions", "int"), c("gross", "Gross (MRP)", "money"), c("discount", "Discount", "money"), c("returns", "Returns", "money"), c("net", "Net sales", "money")],
        rows: rows.filter((r) => r.qty > 0).sort((a, b) => b.net - a.net),
      };
    },
  },
  {
    id: "discounts", title: "Discount report", group: "Products", description: "Every discounted transaction: MRP value, discount and %.",
    build: async (f) => ({
      cols: [c("date", "Date", "date"), c("ref", "Ref"), c("buyerType", "Buyer type"), c("buyer", "Buyer"), c("gross", "MRP value", "money"), c("discount", "Discount", "money"), c("pct", "Discount %", "pct"), c("net", "Net", "money")],
      rows: (await discountTransactions(await facts(f))).map((t) => ({ date: t.at, ref: t.orderId.slice(0, 8).toUpperCase(), buyerType: BUYER_LABEL[t.buyer as Buyer], buyer: t.buyerName, gross: t.gross, discount: t.discount, pct: t.pct, net: t.net })),
    }),
  },
  {
    id: "returns", title: "Returns & cancellation report", group: "Operations", description: "Returned items and cancelled entries in the period.",
    build: async (f) => {
      const [fx, canc] = await Promise.all([facts(f), cancellations(f, f.period.from, f.period.to)]);
      const names = await buyerNames([...new Set([...fx.returns.map((r) => r.orderId), ...canc.map((x) => x.id)])]);
      return {
        cols: [c("date", "Date", "date"), c("kind", "Type"), c("ref", "Ref"), c("buyerType", "Buyer type"), c("buyer", "Buyer"), c("item", "Item"), c("qty", "Qty", "int"), c("amount", "Value", "money")],
        rows: [
          ...fx.returns.map((r) => ({ date: r.at, kind: "Return", ref: r.orderId.slice(0, 8).toUpperCase(), buyerType: BUYER_LABEL[r.buyer], buyer: names.get(r.orderId) ?? "", item: r.title, qty: r.qty, amount: r.amount })),
          ...canc.map((x) => ({ date: x.createdAt, kind: "Cancelled", ref: x.id.slice(0, 8).toUpperCase(), buyerType: BUYER_LABEL[x.buyerType], buyer: names.get(x.id) ?? "", item: "", qty: null, amount: x.subtotal - x.discountAmount })),
        ].sort((a, b) => (b.date as Date).getTime() - (a.date as Date).getTime()),
      };
    },
  },
  { id: "school-credit", title: "School credit report", group: "Credit", snapshot: true, description: "Limit, outstanding, utilisation, status and overdue for every school.", build: () => creditReport("school") },
  { id: "vendor-credit", title: "Vendor credit report", group: "Credit", snapshot: true, description: "Limit, outstanding, utilisation, status and overdue for every vendor.", build: () => creditReport("vendor") },
  { id: "outstanding", title: "Outstanding report", group: "Credit", snapshot: true, description: "Every account currently owing money.", build: () => creditReport(undefined, true) },
  {
    id: "ageing", title: "Credit ageing report", group: "Credit", snapshot: true, description: "Outstanding split by age bucket (oldest issues settled first).",
    build: async () => {
      const { accounts } = await loadAccounts();
      return {
        cols: [c("code", "Code"), c("name", "Name"), c("type", "Type"), c("outstanding", "Outstanding", "money"), ...BUCKETS.map(([k, l]) => c(k, l, "money")), c("overdue", "Overdue", "money")],
        rows: accounts.filter((a) => a.open.length).sort((a, b) => b.daysOutstanding - a.daysOutstanding).map((a) => ({
          code: a.code, name: a.name, type: a.kind === "school" ? "School" : "Vendor", outstanding: a.open.reduce((s, i) => s + i.open, 0),
          ...Object.fromEntries(BUCKETS.map(([k]) => [k, a.buckets[k]])), overdue: a.overdue,
        })),
      };
    },
  },
  {
    id: "credit-ledger", title: "Credit ledger", group: "Credit", description: "Statement lines for every school and vendor in the period, with opening balances.",
    build: async (f) => {
      const include = { orders: { include: { items: { select: { title: true } }, payments: { select: { method: true, amount: true } }, returns: { select: { id: true, amount: true, note: true, createdAt: true } } } }, payments: true } as const;
      const [schools, vendors] = await Promise.all([db.school.findMany({ include }), db.vendor.findMany({ include })]);
      const rows: Row[] = [];
      for (const [type, list] of [["School", schools], ["Vendor", vendors]] as const) {
        for (const a of list) {
          const st = buildStatement(a.orders, a.payments, { noun: "Issued", fromMs: f.period.from.getTime(), toMs: f.period.to.getTime() - 1 });
          if (!st.rows.length && !st.opening) continue;
          rows.push({ code: a.code, name: a.name, type, date: f.period.from, transaction: "Opening balance", sale: null, payment: null, added: null, adjusted: null, balance: st.opening });
          for (const r of st.rows) rows.push({ code: a.code, name: a.name, type, date: new Date(r.date), transaction: r.label, sale: r.sale || null, payment: r.paid || null, added: r.creditAdded || null, adjusted: r.creditAdjusted || null, balance: r.running });
        }
      }
      return {
        cols: [c("code", "Code"), c("name", "Account"), c("type", "Type"), c("date", "Date", "date"), c("transaction", "Transaction"), c("sale", "Sale", "money"), c("payment", "Payment", "money"), c("added", "Credit added", "money"), c("adjusted", "Credit adjusted", "money"), c("balance", "Balance", "money")],
        rows,
      };
    },
  },
  {
    id: "credit-exceptions", title: "Credit limit exception report", group: "Credit", description: "Accounts over / near their limit and every admin override in the period.",
    build: async (f) => {
      const [{ accounts }, overrides] = await Promise.all([
        loadAccounts(),
        db.order.findMany({ where: { creditOverrideById: { not: null }, createdAt: { gte: f.period.from, lt: f.period.to } }, select: { id: true, createdAt: true, total: true, school: { select: { name: true, code: true } }, vendor: { select: { name: true, code: true } } } }),
      ]);
      return {
        cols: [c("kind", "Exception"), c("account", "Account"), c("limit", "Credit limit", "money"), c("outstanding", "Outstanding", "money"), c("utilisation", "Utilisation %", "pct"), c("date", "Date", "date"), c("ref", "Ref"), c("amount", "Entry value", "money")],
        rows: [
          ...accounts.filter((a) => ["exceeded", "reached", "near"].includes(a.status)).map((a) => ({ kind: STATUS_LABEL[a.status], account: `${a.name}${a.code ? ` (${a.code})` : ""}`, limit: a.creditLimit, outstanding: a.balance, utilisation: a.utilisation, date: null, ref: null, amount: null })),
          ...overrides.map((o) => { const acct = o.school ?? o.vendor; return { kind: "Admin override", account: acct ? `${acct.name}${acct.code ? ` (${acct.code})` : ""}` : "", limit: null, outstanding: null, utilisation: null, date: o.createdAt, ref: o.id.slice(0, 8).toUpperCase(), amount: o.total }; }),
        ],
      };
    },
  },
  {
    id: "collections", title: "Collection report", group: "Collections", description: "Every payment received: at the counter/online and school/vendor settlements.",
    build: async (f) => {
      const fx = await facts(f);
      const names = await buyerNames(fx.atSalePayments.map((p) => p.orderId));
      const accts = await Promise.all([
        db.school.findMany({ where: { id: { in: fx.settlements.filter((s) => s.kind === "school").map((s) => s.accountId) } }, select: { id: true, name: true, code: true } }),
        db.vendor.findMany({ where: { id: { in: fx.settlements.filter((s) => s.kind === "vendor").map((s) => s.accountId) } }, select: { id: true, name: true, code: true } }),
      ]).then(([a, b]) => new Map([...a, ...b].map((x) => [x.id, `${x.name}${x.code ? ` (${x.code})` : ""}`])));
      return {
        cols: [c("date", "Date", "date"), c("source", "Source"), c("buyerType", "Buyer type"), c("from", "Received from"), c("method", "Mode"), c("amount", "Amount", "money")],
        rows: [
          ...fx.atSalePayments.map((p) => { const o = fx.orders.get(p.orderId)!; return { date: o.at, source: "At sale", buyerType: BUYER_LABEL[o.buyer], from: names.get(p.orderId) ?? "", method: modeLabel(p.method), amount: p.amount }; }),
          ...fx.settlements.map((s) => ({ date: s.at, source: "Settlement", buyerType: s.kind === "school" ? "School" : "Vendor", from: accts.get(s.accountId) ?? "", method: modeLabel(s.method), amount: s.amount })),
        ].sort((a, b) => b.date.getTime() - a.date.getTime()),
      };
    },
  },
  {
    id: "payment-modes", title: "Payment mode report", group: "Collections", description: "Number of payments and amount per payment mode.",
    build: async (f) => {
      const rows = paymentModes(await facts(f));
      const total = rows.reduce((s, r) => s + r.amount, 0);
      return {
        cols: [c("method", "Mode"), c("transactions", "Payments", "int"), c("atSale", "At sale", "money"), c("settlements", "Settlements", "money"), c("amount", "Total", "money"), c("share", "Share %", "pct")],
        rows: rows.map((r) => ({ method: modeLabel(r.method), transactions: r.transactions, atSale: r.atSale, settlements: r.settlements, amount: r.amount, share: pct1(r.amount, total) })),
      };
    },
  },
];

export const REPORT_GROUPS: ReportDef["group"][] = ["Sales", "Customers", "Products", "Credit", "Collections", "Operations"];
export const getReport = (id: string) => REPORTS.find((r) => r.id === id) ?? null;

/** One-line description of the active filters for report headers. */
export function filterLine(f: DashFilters, snapshot = false): string {
  const parts = [snapshot ? `As of ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })}` : f.period.label];
  if (f.channel) parts.push(CHANNEL_LABEL[f.channel]);
  if (f.buyer) parts.push(BUYER_LABEL[f.buyer]);
  if (f.category) parts.push("category filter applied");
  return parts.join(" · ");
}
