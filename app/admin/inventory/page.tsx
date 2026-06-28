"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, Search, Check, X } from "lucide-react";

type InvItem = { name: string; sku: string; type: string; stock: number | null; threshold: number; variants: { label: string; stock: number }[] | null };

const BASE_INVENTORY: InvItem[] = [
  { name: "Nahjul Balagha",             sku: "BK-001", type: "Book",   stock: 24,   threshold: 5, variants: null },
  { name: "Tafseer e Namoona Vol 1",    sku: "BK-002", type: "Book",   stock: 18,   threshold: 5, variants: null },
  { name: "Tafseer e Namoona Vol 2",    sku: "BK-003", type: "Book",   stock: 9,    threshold: 5, variants: null },
  { name: "Tafseer e Saafi Vol 1",      sku: "BK-004", type: "Book",   stock: 14,   threshold: 5, variants: null },
  { name: "Tafseer e Saafi Vol 3",      sku: "BK-006", type: "Book",   stock: 3,    threshold: 5, variants: null },
  { name: "Alam Panja (Brass)",         sku: "GF-001", type: "Gift",   stock: null, threshold: 3, variants: [{ label: "Large", stock: 7 }, { label: "Small", stock: 12 }] },
  { name: "Alam Patka",                 sku: "GF-002", type: "Gift",   stock: null, threshold: 3, variants: [{ label: "Small", stock: 2 }, { label: "Large", stock: 8 }] },
  { name: "Mashak Brass Small",         sku: "GF-003", type: "Gift",   stock: 15,   threshold: 4, variants: null },
  { name: "Islamic Mug — Bismillah",    sku: "GF-004", type: "Gift",   stock: 0,    threshold: 5, variants: null },
  { name: "Prayer Mat — Ladies Floral", sku: "LD-001", type: "Ladies", stock: 20,   threshold: 5, variants: null },
  { name: "Abaya — Black",              sku: "LD-002", type: "Ladies", stock: null, threshold: 3, variants: [{ label: "S", stock: 4 }, { label: "M", stock: 8 }, { label: "L", stock: 2 }, { label: "XL", stock: 0 }] },
  { name: "Hijab — Chiffon",            sku: "LD-003", type: "Ladies", stock: null, threshold: 8, variants: [{ label: "Cream", stock: 35 }, { label: "Black", stock: 22 }, { label: "Grey", stock: 14 }] },
  { name: "Gents Kurta — White",        sku: "GT-001", type: "Gents",  stock: null, threshold: 3, variants: [{ label: "M", stock: 1 }, { label: "L", stock: 0 }, { label: "XL", stock: 3 }] },
  { name: "Attar — Oud Rose 6ml",       sku: "GT-002", type: "Gents",  stock: 22,   threshold: 6, variants: null },
];

function totalStock(item: InvItem) {
  return item.stock ?? (item.variants?.reduce((s, v) => s + v.stock, 0) ?? 0);
}

function stockLevel(stock: number, threshold: number) {
  if (stock === 0) return { label: "Out of stock", cls: "text-error" };
  if (stock <= threshold) return { label: "Low", cls: "text-accent-amber" };
  return { label: "OK", cls: "text-success" };
}

export default function AdminInventory() {
  const [query,     setQuery]     = useState("");
  const [inventory, setInventory] = useState(BASE_INVENTORY);
  const [editing,   setEditing]   = useState<string | null>(null);
  const [editVal,   setEditVal]   = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));
  }, [inventory, query]);

  const lowCount = inventory.filter(p => totalStock(p) <= p.threshold).length;

  function startEdit(sku: string, currentVal: number) {
    setEditing(sku);
    setEditVal(prev => ({ ...prev, [sku]: String(currentVal) }));
  }
  function saveEdit(sku: string) {
    const val = parseInt(editVal[sku] ?? "0", 10);
    if (isNaN(val) || val < 0) { setEditing(null); return; }
    setInventory(prev => prev.map(p => p.sku === sku ? { ...p, stock: p.variants ? p.stock : val } : p));
    setEditing(null);
  }

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Inventory</h1>
          <p className="text-sm text-on-dark-soft mt-0.5">Stock levels across all products</p>
        </div>
        {lowCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-error/10 border border-error/20 rounded-lg">
            <AlertTriangle size={14} className="text-error" />
            <span className="text-xs text-error font-medium">{lowCount} items need restocking</span>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-dark-soft" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by product name, SKU, or type…"
          className="w-full h-9 pl-9 pr-3 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary"
        />
      </div>

      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {["Product", "SKU", "Type", "Stock / Variants", "Status", "Actions"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-on-dark-soft">No items match your search.</td>
              </tr>
            ) : filtered.map((p, i) => {
              const ts = totalStock(p);
              const { label, cls } = stockLevel(ts, p.threshold);
              return (
                <tr key={p.sku} className={`hover:bg-white/3 transition-colors ${i < filtered.length - 1 ? "border-b border-white/8" : ""}`}>
                  <td className="px-5 py-3.5 text-on-dark font-medium">{p.name}</td>
                  <td className="px-5 py-3.5 font-mono text-xs text-on-dark-soft">{p.sku}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-on-dark-soft">{p.type}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {p.variants ? (
                      <div className="flex flex-wrap gap-2">
                        {p.variants.map(v => (
                          <span key={v.label} className={`text-xs ${v.stock === 0 ? "text-error" : v.stock <= 3 ? "text-accent-amber" : "text-on-dark-soft"}`}>
                            {v.label}: <strong className="text-on-dark">{v.stock}</strong>
                          </span>
                        ))}
                      </div>
                    ) : editing === p.sku ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          autoFocus
                          type="number"
                          min="0"
                          value={editVal[p.sku] ?? ""}
                          onChange={e => setEditVal(prev => ({ ...prev, [p.sku]: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") saveEdit(p.sku); if (e.key === "Escape") setEditing(null); }}
                          className="w-20 h-7 px-2 text-xs bg-surface-dark border border-white/20 rounded text-on-dark focus:outline-none focus:border-primary"
                        />
                        <button onClick={() => saveEdit(p.sku)} className="w-6 h-6 flex items-center justify-center rounded bg-success/15 text-success hover:bg-success/25 transition-colors"><Check size={11} /></button>
                        <button onClick={() => setEditing(null)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/8 text-on-dark-soft transition-colors"><X size={11} /></button>
                      </div>
                    ) : (
                      <span className="text-on-dark font-medium">{p.stock} units</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium ${cls}`}>{label}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {!p.variants && (
                      <button
                        onClick={() => startEdit(p.sku, p.stock ?? 0)}
                        className="text-xs text-primary hover:text-primary-active transition-colors"
                      >
                        Update stock
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
