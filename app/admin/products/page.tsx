"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Filter, Loader2 } from "lucide-react";

interface Product {
  id: string;
  title: string;
  type: string;
  price: number;     // paise
  inStock: boolean;
  _count?: { images: number };
  variants: { stock: number }[];
}

function stockLabel(p: Product) {
  const total = p.variants.length
    ? p.variants.reduce((s, v) => s + v.stock, 0)
    : p.inStock ? 99 : 0;
  if (total === 0) return { label: "Out of stock", cls: "text-error" };
  if (total <= 3)  return { label: `${total} units`, cls: "text-accent-amber" };
  return             { label: `${total} units`, cls: "text-success" };
}

const TYPES = ["All", "book", "gift", "ladies", "gents"];
const PER_PAGE = 10;

export default function AdminProducts() {
  const [query,    setQuery]    = useState("");
  const [typeTab,  setTypeTab]  = useState("All");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/products");
    const d = await res.json();
    setProducts(d.products ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter(p =>
      (typeTab === "All" || p.type === typeTab) &&
      (!q || p.title.toLowerCase().includes(q) || p.type.toLowerCase().includes(q))
    );
  }, [products, query, typeTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function handleTabChange(t: string) { setTypeTab(t); setPage(1); setSelected(new Set()); }
  function handleQuery(q: string)     { setQuery(q);   setPage(1); }

  function toggleSelect(id: string) {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll() {
    const ids = paged.map(p => p.id);
    const allSel = ids.every(id => selected.has(id));
    setSelected(prev => { const n = new Set(prev); ids.forEach(id => allSel ? n.delete(id) : n.add(id)); return n; });
  }

  async function deleteProduct(id: string) {
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setProducts(prev => prev.filter(p => p.id !== id));
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
  }
  async function deleteSelected() {
    const ids = [...selected];
    await fetch("/api/admin/products", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
    setProducts(prev => prev.filter(p => !selected.has(p.id)));
    setSelected(new Set());
  }

  const allOnPageSelected = paged.length > 0 && paged.every(p => selected.has(p.id));

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Products</h1>
          <p className="text-sm text-on-dark-soft mt-0.5">{filtered.length} of {products.length} products</p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={deleteSelected}
              className="h-9 px-4 bg-error/15 text-error text-sm font-medium rounded-md flex items-center gap-2 hover:bg-error/25 transition-colors"
            >
              <Trash2 size={14} /> Delete {selected.size}
            </button>
          )}
          <a
            href="/admin/products/new"
            className="h-9 px-4 bg-primary text-white text-sm font-medium rounded-md flex items-center gap-2 hover:bg-primary-active transition-colors"
          >
            <Plus size={14} /> Add Product
          </a>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-dark-soft" />
          <input
            type="text"
            value={query}
            onChange={e => handleQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full h-9 pl-9 pr-3 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-1 bg-surface-dark-elevated border border-white/8 rounded-md p-0.5">
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => handleTabChange(t)}
              className={`px-3 h-7 text-xs font-medium rounded capitalize transition-colors ${typeTab === t ? "bg-white/10 text-on-dark" : "text-on-dark-soft hover:text-on-dark"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-on-dark-soft">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="px-5 py-3 text-left w-8">
                <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} className="rounded accent-[#cc785c] cursor-pointer" />
              </th>
              {["Product", "Type", "Price", "Stock", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-on-dark-soft">
                  {products.length === 0 ? "No products yet. Add your first product." : "No products match your search."}
                </td>
              </tr>
            ) : paged.map((p, i) => {
              const stock = stockLabel(p);
              return (
                <tr
                  key={p.id}
                  className={`hover:bg-white/3 transition-colors ${i < paged.length - 1 ? "border-b border-white/8" : ""} ${selected.has(p.id) ? "bg-primary/5" : ""}`}
                >
                  <td className="px-5 py-3.5">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="rounded accent-[#cc785c] cursor-pointer" />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-on-dark font-medium">{p.title}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-on-dark-soft font-medium capitalize">{p.type}</span>
                  </td>
                  <td className="px-4 py-3.5 text-on-dark font-medium">₹{(p.price / 100).toFixed(0)}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-medium ${stock.cls}`}>{stock.label}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/admin/products/${p.id}/edit`}
                        className="w-7 h-7 flex items-center justify-center rounded text-on-dark-soft hover:text-on-dark hover:bg-white/8 transition-colors"
                      >
                        <Pencil size={13} />
                      </a>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="w-7 h-7 flex items-center justify-center rounded text-on-dark-soft hover:text-error hover:bg-error/10 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
        <div className="px-5 py-3 border-t border-white/8 flex items-center justify-between gap-4">
          <span className="text-xs text-on-dark-soft shrink-0">
            {filtered.length === 0 ? "0 products" : `${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length}`}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-7 px-3 text-xs rounded text-on-dark-soft hover:text-on-dark disabled:opacity-30 transition-colors"
            >
              ← Prev
            </button>
            <span className="text-xs text-on-dark-soft">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="h-7 px-3 text-xs rounded text-on-dark-soft hover:text-on-dark disabled:opacity-30 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
