"use client";

import { useState, useMemo, useEffect, useCallback, Fragment } from "react";
import { AlertTriangle, Search, Loader2, Plus, Pencil, History, X } from "lucide-react";

type Variant = { id: string; label: string; stock: number };
type Product = {
  id: string; title: string; slug: string; type: string;
  inStock: boolean; stock: number; variants: Variant[];
};
type Movement = {
  id: string; delta: number; reason: string; refType: string | null; refId: string | null;
  note: string | null; createdAt: string;
  variant: { label: string } | null;
  user: { name: string | null; email: string } | null;
};

type PanelMode = "restock" | "adjust" | "history";
type Panel = { productId: string; variantId: string | null; mode: PanelMode };

function stockClass(n: number) {
  return n <= 0 ? "text-error" : n <= 3 ? "text-accent-amber" : "text-on-dark";
}

export default function DeskInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [query,    setQuery]    = useState("");
  const [panel,    setPanel]    = useState<Panel | null>(null);
  const [value,    setValue]    = useState("");
  const [note,     setNote]     = useState("");
  const [saving,   setSaving]   = useState(false);
  const [history,  setHistory]  = useState<Movement[]>([]);
  const [histLoading, setHistLoading] = useState(false);

  const load = useCallback(() => {
    fetch("/api/desk/inventory")
      .then(r => r.json())
      .then(d => { setProducts(d.products ?? []); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p => p.title.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));
  }, [products, query]);

  const outCount = products.filter(p =>
    p.variants.length > 0 ? p.variants.every(v => v.stock <= 0) : p.stock <= 0
  ).length;

  function openPanel(productId: string, variantId: string | null, mode: PanelMode) {
    setPanel({ productId, variantId, mode });
    setValue("");
    setNote("");
    setHistory([]);
    if (mode === "history") {
      setHistLoading(true);
      fetch(`/api/desk/inventory/movements?productId=${productId}`)
        .then(r => r.json())
        .then(d => { setHistory(d.movements ?? []); setHistLoading(false); });
    }
  }

  async function submit() {
    if (!panel || panel.mode === "history") return;
    setSaving(true);
    const res = await fetch("/api/desk/inventory/movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: panel.productId,
        variantId: panel.variantId,
        mode: panel.mode,
        value: Number(value),
        note: note.trim() || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error ?? "Could not save.");
      return;
    }
    setPanel(null);
    load();
  }

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Inventory</h1>
          <p className="text-sm text-on-dark-soft mt-0.5">Shared stock — online, offline and school all draw from here</p>
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
                {["Product", "Type", "On hand", "Actions"].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-on-dark-soft">
                  {products.length === 0 ? "No products yet." : "No items match your search."}
                </td></tr>
              ) : filtered.map((p, i) => {
                const rows: { variantId: string | null; label: string | null; stock: number }[] =
                  p.variants.length > 0
                    ? p.variants.map(v => ({ variantId: v.id, label: v.label, stock: v.stock }))
                    : [{ variantId: null, label: null, stock: p.stock }];
                const panelOpen = panel?.productId === p.id;
                return (
                  <Fragment key={p.id}>
                    <tr className={`hover:bg-white/3 transition-colors ${!panelOpen && i < filtered.length - 1 ? "border-b border-white/8" : ""}`}>
                      <td className="px-5 py-3.5 text-on-dark font-medium max-w-[220px] truncate align-top">{p.title}</td>
                      <td className="px-5 py-3.5 align-top">
                        <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-on-dark-soft capitalize">{p.type}</span>
                      </td>
                      <td className="px-5 py-3.5 align-top">
                        <div className="flex flex-col gap-1">
                          {rows.map(r => (
                            <span key={r.variantId ?? "base"} className="text-xs text-on-dark-soft">
                              {r.label ? `${r.label}: ` : ""}
                              <strong className={stockClass(r.stock)}>{r.stock}</strong>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 align-top">
                        <div className="flex flex-col gap-1.5">
                          {rows.map(r => (
                            <div key={r.variantId ?? "base"} className="flex items-center gap-1.5">
                              {r.label && <span className="text-[11px] text-on-dark-soft w-16 truncate">{r.label}</span>}
                              <button onClick={() => openPanel(p.id, r.variantId, "restock")}
                                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-success/10 text-success hover:bg-success/20 transition-colors">
                                <Plus size={11} /> Restock
                              </button>
                              <button onClick={() => openPanel(p.id, r.variantId, "adjust")}
                                className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-white/5 text-on-dark-soft hover:bg-white/10 transition-colors">
                                <Pencil size={11} /> Adjust
                              </button>
                            </div>
                          ))}
                          <button onClick={() => openPanel(p.id, null, "history")}
                            className="flex items-center gap-1 text-[11px] px-2 py-1 rounded text-on-dark-soft hover:text-on-dark self-start transition-colors">
                            <History size={11} /> History
                          </button>
                        </div>
                      </td>
                    </tr>

                    {panelOpen && (
                      <tr className={i < filtered.length - 1 ? "border-b border-white/8" : ""}>
                        <td colSpan={4} className="px-5 py-4 bg-surface-dark/60">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold uppercase tracking-wide text-on-dark-soft">
                              {panel.mode === "restock" && "Add stock"}
                              {panel.mode === "adjust" && "Set on-hand count"}
                              {panel.mode === "history" && "Movement history"}
                              {panel.variantId && rows.find(r => r.variantId === panel.variantId)?.label
                                ? ` — ${rows.find(r => r.variantId === panel.variantId)?.label}` : ""}
                            </h3>
                            <button onClick={() => setPanel(null)} className="text-on-dark-soft hover:text-on-dark">
                              <X size={14} />
                            </button>
                          </div>

                          {panel.mode === "history" ? (
                            histLoading ? (
                              <div className="flex items-center gap-2 text-xs text-on-dark-soft py-3">
                                <Loader2 size={13} className="animate-spin" /> Loading…
                              </div>
                            ) : history.length === 0 ? (
                              <p className="text-xs text-on-dark-soft py-2">No movements recorded.</p>
                            ) : (
                              <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                                {history.map(m => (
                                  <div key={m.id} className="flex items-center justify-between text-xs border-b border-white/5 pb-1.5">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={`font-mono font-semibold ${m.delta < 0 ? "text-error" : "text-success"}`}>
                                        {m.delta > 0 ? `+${m.delta}` : m.delta}
                                      </span>
                                      <span className="text-on-dark-soft capitalize">{m.reason.replace(/_/g, " ")}</span>
                                      {m.variant?.label && <span className="text-on-dark-soft/70">({m.variant.label})</span>}
                                      {m.note && <span className="text-on-dark-soft/70 truncate">· {m.note}</span>}
                                    </div>
                                    <span className="text-on-dark-soft/60 shrink-0 ml-3">
                                      {new Date(m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                      {m.user?.name ? ` · ${m.user.name}` : ""}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )
                          ) : (
                            <div className="flex flex-wrap items-end gap-3">
                              <label className="flex flex-col gap-1">
                                <span className="text-[11px] text-on-dark-soft">
                                  {panel.mode === "restock" ? "Quantity to add" : "New on-hand count"}
                                </span>
                                <input
                                  autoFocus type="number" min={panel.mode === "restock" ? 1 : 0}
                                  value={value} onChange={e => setValue(e.target.value)}
                                  className="w-32 h-8 px-2 text-sm bg-surface-dark border border-white/20 rounded text-on-dark focus:outline-none focus:border-primary"
                                />
                              </label>
                              <label className="flex flex-col gap-1 flex-1 min-w-[160px]">
                                <span className="text-[11px] text-on-dark-soft">Note (optional)</span>
                                <input
                                  value={note} onChange={e => setNote(e.target.value)}
                                  placeholder="e.g. delivery from distributor"
                                  className="w-full h-8 px-2 text-sm bg-surface-dark border border-white/20 rounded text-on-dark placeholder:text-on-dark-soft/60 focus:outline-none focus:border-primary"
                                />
                              </label>
                              <button
                                onClick={submit} disabled={saving || value === ""}
                                className="h-8 px-4 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary-active transition-colors disabled:opacity-50"
                              >
                                {saving ? "Saving…" : "Save"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
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
