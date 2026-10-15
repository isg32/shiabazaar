"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Loader2, Pencil, CheckCircle2, ImageOff, Layers } from "lucide-react";

type Row = {
  id: string; title: string; sku: string | null; type: string; reviewedAt: string | null; reviewedBy: string | null;
  images: { url: string }[];
};
type Counts = { pending: number; approved: number; rejected: number };
const FILTERS: [string, string][] = [["all", "All"], ["books", "Books"], ["other", "Other products"], ["noimage", "No image"]];
const TYPE_LABEL: Record<string, string> = { book: "Book", gift: "Gift", ladies: "Ladies", gents: "Gents", other: "Other" };

export default function FixList() {
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((f: string, query: string) => {
    fetch(`/api/admin/review?filter=${f}&q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => { setRows(d.products ?? []); setCounts(d.counts ?? null); setLoading(false); });
  }, []);
  useEffect(() => { load("all", ""); }, [load]);

  function apply(f: string, query: string) { setFilter(f); setLoading(true); load(f, query); }

  async function markFixed(id: string) {
    setBusy(id); setError(null);
    const res = await fetch(`/api/admin/review/${id}`, { method: "POST" });
    setBusy(null);
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "Could not mark as fixed."); return; }
    setRows((r) => r.filter((x) => x.id !== id));
    setCounts((c) => c && { ...c, rejected: c.rejected - 1, approved: c.approved + 1 });
  }

  const total = counts ? counts.pending + counts.approved + counts.rejected : 0;

  return (
    <div className="px-4 sm:px-8 py-8 text-on-dark">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Fix list</h1>
          <p className="text-sm text-on-dark-soft mt-0.5" data-testid="fix-summary">
            {counts ? <>Products disapproved in review · {counts.rejected} to fix · {counts.approved} approved · {counts.pending} not reviewed yet (of {total})</> : "Loading…"}
          </p>
        </div>
        <Link href="/desk/review" className="h-9 px-4 bg-primary text-white text-sm font-medium rounded-md flex items-center gap-2 hover:bg-primary-active transition-colors">
          <Layers size={14} /> Review products
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1 bg-surface-dark-elevated border border-white/8 rounded-md p-0.5">
          {FILTERS.map(([f, label]) => (
            <button key={f} onClick={() => apply(f, q)}
              className={`px-3 h-7 text-xs font-medium rounded transition-colors ${filter === f ? "bg-white/10 text-on-dark" : "text-on-dark-soft hover:text-on-dark"}`}>{label}</button>
          ))}
        </div>
        <form className="relative flex-1 min-w-[200px]" onSubmit={(e) => { e.preventDefault(); apply(filter, q); }}>
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-dark-soft" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title or SKU, then Enter…"
            className="w-full h-9 pl-9 pr-3 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary" />
        </form>
      </div>

      {error && <p className="text-sm text-error mb-3">{error}</p>}

      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden" data-testid="fix-list">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-on-dark-soft"><Loader2 size={16} className="animate-spin" /> Loading…</div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-on-dark-soft text-center py-12">Nothing to fix. Disapproved products from review show up here.</p>
        ) : rows.map((r) => (
          <div key={r.id} className="flex items-center gap-4 px-4 sm:px-5 py-3 border-b border-white/8 last:border-0">
            <div className="relative w-12 h-16 shrink-0 rounded bg-white/5 overflow-hidden flex items-center justify-center">
              {r.images[0] ? <Image src={r.images[0].url} alt="" fill sizes="48px" className="object-cover" /> : <ImageOff size={16} className="text-on-dark-soft" aria-label="No image" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-on-dark truncate">{r.title}</p>
              <p className="text-[11px] text-on-dark-soft">
                <span className="font-mono">{r.sku ?? "—"}</span> · {TYPE_LABEL[r.type] ?? r.type}
                {r.reviewedAt && <> · disapproved {new Date(r.reviewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{r.reviewedBy ? ` by ${r.reviewedBy}` : ""}</>}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Link href={r.type === "book" ? `/admin/books/${r.id}/edit` : `/admin/products/${r.id}/edit`}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded bg-white/5 text-on-dark-soft hover:bg-white/10 hover:text-on-dark transition-colors">
                <Pencil size={11} /> Edit
              </Link>
              <button onClick={() => markFixed(r.id)} disabled={busy === r.id}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50">
                <CheckCircle2 size={11} /> Mark fixed
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
