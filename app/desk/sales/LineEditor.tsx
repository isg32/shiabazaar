"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Trash2, Loader2, Plus } from "lucide-react";

export type CatalogVariant = { id: string; label: string; stock: number; price?: number };
export type CatalogProduct = {
  id: string; title: string; author?: string; price: number; inStock: boolean;
  variants?: CatalogVariant[];
};

export type SaleLine = {
  key: string;
  productId: string;
  productTitle: string;
  variantId: string | null;
  variants: CatalogVariant[];
  qty: number;
  mrp: number; // rupees, catalogue price
  unitPrice: number; // rupees, selling price after line discount
};

const round2 = (n: number) => Math.round(n * 100) / 100;
/** Line discount as a % of MRP, for display. */
export const lineDiscountPct = (l: Pick<SaleLine, "mrp" | "unitPrice">) =>
  l.mrp > 0 ? round2((1 - l.unitPrice / l.mrp) * 100) : 0;

let seq = 0;
export const nextLineKey = () => `l${++seq}`;

/** Product search + editable line-items table (MRP, line discount, unit price). */
export default function LineEditor({
  lines,
  onChange,
}: {
  lines: SaleLine[];
  onChange: (lines: SaleLine[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const t = setTimeout(() => {
      setSearching(true);
      fetch(`/api/products?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d) => { setResults(d.products ?? []); setShowResults(true); })
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function onQueryChange(v: string) {
    setQuery(v);
    if (!v.trim()) { setResults([]); setShowResults(false); }
  }

  function addProduct(p: CatalogProduct) {
    const variants = p.variants ?? [];
    const firstVariant = variants[0] ?? null;
    onChange([
      ...lines,
      {
        key: nextLineKey(),
        productId: p.id,
        productTitle: p.title,
        variantId: firstVariant?.id ?? null,
        variants,
        qty: 1,
        mrp: firstVariant?.price ?? p.price,
        unitPrice: firstVariant?.price ?? p.price,
      },
    ]);
    setQuery("");
    setResults([]);
    setShowResults(false);
  }

  function updateLine(key: string, patch: Partial<SaleLine>) {
    onChange(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function removeLine(key: string) {
    onChange(lines.filter((l) => l.key !== key));
  }
  function pickVariant(key: string, variantId: string) {
    onChange(
      lines.map((l) => {
        if (l.key !== key) return l;
        const v = l.variants.find((v) => v.id === variantId);
        const price = v?.price ?? l.mrp;
        return { ...l, variantId, mrp: price, unitPrice: price };
      }),
    );
  }

  return (
    <>
      <div ref={searchRef} className="relative mb-5">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-dark-soft" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => results.length && setShowResults(true)}
          placeholder="Search products to add…"
          className="w-full h-10 pl-9 pr-8 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary"
        />
        {searching && <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-on-dark-soft" />}
        {showResults && results.length > 0 && (
          <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto bg-surface-dark-elevated border border-white/10 rounded-md shadow-lg">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-white/5 transition-colors"
              >
                <span className="text-on-dark truncate">{p.title}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-on-dark-soft">₹{p.price}</span>
                  <Plus size={12} className="text-primary" />
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden mb-4">
        {lines.length === 0 ? (
          <p className="text-sm text-on-dark-soft text-center py-8">No items yet — search above to add.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {["Item", "Qty", "MRP ₹", "Disc %", "Unit ₹", "Total", ""].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={l.key} className={i < lines.length - 1 ? "border-b border-white/8" : ""}>
                  <td className="px-4 py-2.5">
                    <p className="text-on-dark">{l.productTitle}</p>
                    {l.variants.length > 0 && (
                      <select
                        value={l.variantId ?? ""}
                        onChange={(e) => pickVariant(l.key, e.target.value)}
                        className="mt-1 h-7 px-1.5 text-xs bg-surface-dark border border-white/20 rounded text-on-dark focus:outline-none focus:border-primary"
                      >
                        {l.variants.map((v) => (
                          <option key={v.id} value={v.id}>{v.label} ({v.stock} in stock)</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number" min={1} value={l.qty}
                      onChange={(e) => updateLine(l.key, { qty: Math.max(1, Math.trunc(Number(e.target.value) || 1)) })}
                      className="w-16 h-8 px-1.5 text-sm bg-surface-dark border border-white/20 rounded text-on-dark focus:outline-none focus:border-primary"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-on-dark-soft">{l.mrp.toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number" min={0} max={100} step="0.01" value={lineDiscountPct(l)}
                      aria-label="Line discount percent"
                      onChange={(e) => {
                        const pct = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                        updateLine(l.key, { unitPrice: round2(l.mrp * (1 - pct / 100)) });
                      }}
                      className="w-16 h-8 px-1.5 text-sm bg-surface-dark border border-white/20 rounded text-on-dark focus:outline-none focus:border-primary"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number" min={0} step="0.01" value={l.unitPrice} aria-label="Unit price"
                      onChange={(e) => updateLine(l.key, { unitPrice: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-24 h-8 px-1.5 text-sm bg-surface-dark border border-white/20 rounded text-on-dark focus:outline-none focus:border-primary"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-on-dark font-medium">₹{(l.unitPrice * l.qty).toFixed(2)}</td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => removeLine(l.key)} className="text-on-dark-soft hover:text-error transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </>
  );
}
