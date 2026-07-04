"use client";

import { useState, useMemo, useEffect } from "react";
import { AlertTriangle, Search, Check, X, Loader2 } from "lucide-react";

type Variant = { id: string; label: string; stock: number };
type Product = { id: string; title: string; slug: string; type: string; inStock: boolean; variants: Variant[] };

export default function AdminInventory() {
  const [products,  setProducts]  = useState<Product[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [query,     setQuery]     = useState("");
  const [editVar,   setEditVar]   = useState<string | null>(null);
  const [editVal,   setEditVal]   = useState<Record<string, string>>({});
  const [toggling,  setToggling]  = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/inventory")
      .then(r => r.json())
      .then(d => { setProducts(d.products ?? []); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => p.title.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));
  }, [products, query]);

  const outCount = products.filter(p => !p.inStock).length;

  async function toggleInStock(id: string, current: boolean) {
    setToggling(id);
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inStock: !current }),
    });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, inStock: !current } : p));
    setToggling(null);
  }

  async function saveVariantStock(variantId: string, productId: string) {
    const val = editVal[variantId];
    await fetch(`/api/admin/inventory/variants/${variantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: parseInt(val, 10) || 0 }),
    });
    setProducts(prev => prev.map(p =>
      p.id === productId
        ? { ...p, variants: p.variants.map(v => v.id === variantId ? { ...v, stock: parseInt(val, 10) || 0 } : v) }
        : p
    ));
    setEditVar(null);
  }

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Inventory</h1>
          <p className="text-sm text-on-dark-soft mt-0.5">Stock levels across all products</p>
        </div>
        {outCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-error/10 border border-error/20 rounded-lg">
            <AlertTriangle size={14} className="text-error" />
            <span className="text-xs text-error font-medium">{outCount} products out of stock</span>
          </div>
        )}
      </div>

      <div className="relative mb-5">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-dark-soft" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by product name or type…"
          className="w-full h-9 pl-9 pr-3 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary"
        />
      </div>

      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-on-dark-soft">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {["Product", "Type", "Variants / Stock", "In Stock", ""].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-on-dark-soft">
                  {products.length === 0 ? "No products yet." : "No items match your search."}
                </td></tr>
              ) : filtered.map((p, i) => (
                <tr key={p.id} className={`hover:bg-white/3 transition-colors ${i < filtered.length - 1 ? "border-b border-white/8" : ""}`}>
                  <td className="px-5 py-3.5 text-on-dark font-medium max-w-[200px] truncate">{p.title}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-on-dark-soft capitalize">{p.type}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {p.variants.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {p.variants.map(v => (
                          editVar === v.id ? (
                            <div key={v.id} className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <input
                                autoFocus
                                type="number"
                                min="0"
                                value={editVal[v.id] ?? ""}
                                onChange={e => setEditVal(prev => ({ ...prev, [v.id]: e.target.value }))}
                                onKeyDown={e => { if (e.key === "Enter") saveVariantStock(v.id, p.id); if (e.key === "Escape") setEditVar(null); }}
                                className="w-16 h-6 px-1.5 text-xs bg-surface-dark border border-white/20 rounded text-on-dark focus:outline-none focus:border-primary"
                              />
                              <button onClick={() => saveVariantStock(v.id, p.id)} className="w-5 h-5 flex items-center justify-center rounded bg-success/15 text-success hover:bg-success/25">
                                <Check size={10} />
                              </button>
                              <button onClick={() => setEditVar(null)} className="w-5 h-5 flex items-center justify-center rounded hover:bg-white/8 text-on-dark-soft">
                                <X size={10} />
                              </button>
                            </div>
                          ) : (
                            <button
                              key={v.id}
                              onClick={() => { setEditVar(v.id); setEditVal(prev => ({ ...prev, [v.id]: String(v.stock) })); }}
                              className={`text-xs hover:text-on-dark transition-colors ${v.stock === 0 ? "text-error" : v.stock <= 3 ? "text-accent-amber" : "text-on-dark-soft"}`}
                            >
                              {v.label}: <strong className="text-on-dark">{v.stock}</strong>
                            </button>
                          )
                        ))}
                      </div>
                    ) : (
                      <span className={`text-xs font-medium ${p.inStock ? "text-success" : "text-error"}`}>
                        {p.inStock ? "In stock" : "Out of stock"}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleInStock(p.id, p.inStock)}
                      disabled={toggling === p.id}
                      className={`w-10 h-5 rounded-full transition-colors relative ${p.inStock ? "bg-success" : "bg-white/15"} disabled:opacity-60`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${p.inStock ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-on-dark-soft">
                    {toggling === p.id && <Loader2 size={12} className="animate-spin" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-5 py-3 border-t border-white/8">
          <span className="text-xs text-on-dark-soft">Showing {filtered.length} of {products.length} products</span>
        </div>
      </div>
    </div>
  );
}
