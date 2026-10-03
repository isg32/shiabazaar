import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import FilterBar from "@/components/dashboard/FilterBar";
import ShareBars from "@/components/dashboard/ShareBars";
import { loadFacts, mainCategory, type MainCategory, type ReturnLine, type SaleLine } from "@/lib/bi/facts";
import { parseFilters, withFilters, type SearchParams } from "@/lib/bi/filters";
import { inr, pct } from "@/lib/bi/format";
import { categoryOptions } from "@/lib/bi/categories";
import { productRows } from "@/lib/bi/products";
import { VIZ } from "@/lib/bi/colors";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Categories" };

const MAINS: MainCategory[] = ["Books", "Gifts", "Other"];
const GROUP: Record<MainCategory, string> = { Books: "book", Gifts: "gift", Other: "other" };

type Agg = { key: string; label: string; href?: string; lines: SaleLine[]; returns: ReturnLine[] };

function metrics(a: Agg) {
  const net = Math.round(a.lines.reduce((s, l) => s + l.net, 0)) - a.returns.reduce((s, r) => s + r.amount, 0);
  const gross = a.lines.reduce((s, l) => s + l.gross, 0);
  const qty = a.lines.reduce((s, l) => s + l.qty, 0);
  return { net, gross, qty, discount: gross - Math.round(a.lines.reduce((s, l) => s + l.net, 0)), tx: new Set(a.lines.map((l) => l.orderId)).size };
}

export default async function Categories({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined));
  const mainParam = MAINS.find((m) => m === one("main")) ?? null;
  const nodeId = one("node") ?? null;

  const [facts, cats, allCats] = await Promise.all([
    loadFacts(f, f.period.from, f.period.to),
    categoryOptions(),
    db.category.findMany({ select: { id: true, name: true, parentId: true, group: true } }),
  ]);
  const byId = new Map(allCats.map((c) => [c.id, c]));
  const node = nodeId ? byId.get(nodeId) ?? null : null;
  const main: MainCategory | null = node
    ? (Object.entries(GROUP).find(([, g]) => g === node.group)?.[0] as MainCategory) ?? null
    : mainParam;

  // product → its category ids
  const productIds = [...new Set([...facts.lines.map((l) => l.productId), ...facts.returns.map((r) => r.productId)])];
  const links = productIds.length
    ? await db.productCategory.findMany({ where: { productId: { in: productIds } }, select: { productId: true, categoryId: true } })
    : [];
  const prodCats = new Map<string, string[]>();
  for (const l of links) prodCats.set(l.productId, [...(prodCats.get(l.productId) ?? []), l.categoryId]);

  const children = new Map<string | null, typeof allCats>();
  for (const c of allCats) children.set(c.parentId, [...(children.get(c.parentId) ?? []), c]);
  const subtree = (id: string): Set<string> => {
    const out = new Set<string>([id]);
    for (const ch of children.get(id) ?? []) for (const x of subtree(ch.id)) out.add(x);
    return out;
  };
  const inSubtree = (productId: string, ids: Set<string>) => (prodCats.get(productId) ?? []).some((c) => ids.has(c));

  // Scope of the current level
  let scopeLines = facts.lines, scopeRets = facts.returns;
  if (main) {
    scopeLines = scopeLines.filter((l) => mainCategory(l.type) === main);
    scopeRets = scopeRets.filter((r) => mainCategory(r.type) === main);
  }
  if (node) {
    const ids = subtree(node.id);
    scopeLines = scopeLines.filter((l) => inSubtree(l.productId, ids));
    scopeRets = scopeRets.filter((r) => inSubtree(r.productId, ids));
  }

  // Rows of the next level down
  let rows: Agg[];
  if (!main) {
    rows = MAINS.map((m) => ({
      key: m, label: m, href: withFilters("/dashboard/categories", sp, { main: m, node: null }),
      lines: facts.lines.filter((l) => mainCategory(l.type) === m), returns: facts.returns.filter((r) => mainCategory(r.type) === m),
    }));
  } else {
    const kids = (node ? children.get(node.id) ?? [] : (children.get(null) ?? []).filter((c) => c.group === GROUP[main]));
    rows = kids.map((c) => {
      const ids = subtree(c.id);
      return {
        key: c.id, label: c.name, href: withFilters("/dashboard/categories", sp, { node: c.id, main: null }),
        lines: scopeLines.filter((l) => inSubtree(l.productId, ids)), returns: scopeRets.filter((r) => inSubtree(r.productId, ids)),
      };
    });
    const covered = new Set(kids.flatMap((c) => [...subtree(c.id)]));
    const unc: Agg = {
      key: "_none", label: node ? `Directly in ${node.name}` : "Uncategorised",
      lines: scopeLines.filter((l) => !inSubtree(l.productId, covered)), returns: scopeRets.filter((r) => !inSubtree(r.productId, covered)),
    };
    if (unc.lines.length || unc.returns.length) rows.push(unc);
  }
  const scopeNet = metrics({ key: "", label: "", lines: scopeLines, returns: scopeRets }).net;
  const table = rows.map((r) => ({ r, m: metrics(r) })).filter(({ m }) => m.qty > 0 || m.net !== 0).sort((a, b) => b.m.net - a.m.net);

  // Breadcrumb
  const crumbs: { label: string; href: string }[] = [{ label: "All", href: withFilters("/dashboard/categories", sp, { main: null, node: null }) }];
  if (main) crumbs.push({ label: main, href: withFilters("/dashboard/categories", sp, { main, node: null }) });
  const chain: typeof allCats = [];
  for (let c = node; c; c = c.parentId ? byId.get(c.parentId) ?? null : null) chain.unshift(c);
  for (const c of chain) crumbs.push({ label: c.name, href: withFilters("/dashboard/categories", sp, { node: c.id, main: null }) });

  const products = main ? productRows(scopeLines, scopeRets).filter((p) => p.qty > 0).sort((a, b) => b.revenue - a.revenue).slice(0, 15) : [];

  return (
    <div className="px-8 py-8 text-on-dark">
      <h1 className="text-2xl font-semibold text-on-dark">Category performance</h1>
      <p className="text-sm text-on-dark-soft mt-0.5 mb-5">{f.period.label}</p>
      <FilterBar categories={cats}>
        <nav className="flex items-center gap-1 text-sm mb-4" data-testid="breadcrumb">
          {crumbs.map((c, i) => (
            <span key={c.href} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={13} className="text-on-dark-soft" />}
              {i < crumbs.length - 1 ? <Link href={c.href} className="text-primary hover:text-primary-active">{c.label}</Link> : <span className="text-on-dark">{c.label}</span>}
            </span>
          ))}
        </nav>

        {!main && (
          <div className="mb-6 max-w-xl">
            <ShareBars title="Share of net sales" rows={table.map(({ r, m }) => ({
              key: r.key, label: r.label, value: m.net, valueText: inr(m.net), color: VIZ.main[r.key as MainCategory], href: r.href,
              sub: `${m.qty} units · ${m.tx} transactions`,
            }))} />
          </div>
        )}

        <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-x-auto mb-6">
          <table className="w-full text-sm" data-testid="category-table">
            <thead>
              <tr className="border-b border-white/8">
                {[main ? "Category" : "Main category", "Net sales", "Qty", "Transactions", "Discount", "Avg price", "Contribution"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {table.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-on-dark-soft">No sales at this level in the period.</td></tr>
              ) : table.map(({ r, m }) => (
                <tr key={r.key} className="border-b border-white/5">
                  <td className="px-4 py-3">
                    {r.href ? <Link href={r.href} className="text-on-dark hover:underline">{r.label}</Link> : <span className="text-on-dark-soft">{r.label}</span>}
                  </td>
                  <td className="px-4 py-3 text-on-dark font-medium">{inr(m.net)}</td>
                  <td className="px-4 py-3 text-on-dark-soft">{m.qty}</td>
                  <td className="px-4 py-3 text-on-dark-soft">{m.tx}</td>
                  <td className="px-4 py-3 text-on-dark-soft">{inr(m.discount)}</td>
                  <td className="px-4 py-3 text-on-dark-soft">{m.qty ? inr(Math.round((m.net + 0) / m.qty)) : "—"}</td>
                  <td className="px-4 py-3 text-on-dark-soft">{pct(m.net, scopeNet)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          {main && (
            <p className="px-4 py-3 text-[11px] text-on-dark-soft/70">
              A product tagged with several categories counts in each, so contributions can add up to more than 100%.
            </p>
          )}
        </div>

        {products.length > 0 && (
          <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden" data-testid="category-products">
            <h2 className="px-5 py-4 border-b border-white/8 text-sm font-medium text-on-dark">Top products here</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {["Product", "Qty", "Revenue", "Discount"].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {products.map((p) => (
                  <tr key={p.productId} className="border-b border-white/5">
                    <td className="px-4 py-2.5 text-on-dark">{p.title} <span className="text-[11px] text-on-dark-soft font-mono ml-1">{p.sku}</span></td>
                    <td className="px-4 py-2.5 text-on-dark-soft">{p.qty}</td>
                    <td className="px-4 py-2.5 text-on-dark font-medium">{inr(p.revenue)}</td>
                    <td className="px-4 py-2.5 text-on-dark-soft">{inr(p.discount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </FilterBar>
    </div>
  );
}
