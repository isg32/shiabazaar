"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Loader2, Pencil, CheckCircle2, ImageOff, Layers, Camera } from "lucide-react";

type Row = {
  id: string; slug: string; title: string; sku: string | null; type: string; reviewedAt: string | null; reviewedBy: string | null;
  images: { id: string; url: string; cloudinaryId: string }[];
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

  async function replaceImage(row: Row, file: File) {
    setBusy(row.id); setError(null);
    try {
      if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
      const folder = `shiabazaar/products/${row.slug}`;
      const sign = await fetch("/api/upload", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ folder }),
      }).then((r) => r.json());
      const fd = new FormData();
      fd.append("file", file);
      fd.append("timestamp", sign.timestamp);
      fd.append("signature", sign.signature);
      fd.append("api_key", sign.apiKey);
      fd.append("folder", sign.folder);
      const up = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, { method: "POST", body: fd }).then((r) => r.json());
      if (!up.secure_url) throw new Error(up.error?.message ?? "Upload failed.");

      // Add the new image as cover first, then drop the old one — a failure never leaves the product bare.
      const add = await fetch(`/api/admin/products/${row.id}/images`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: up.secure_url, cloudinaryId: up.public_id, isCover: true }),
      });
      if (!add.ok) throw new Error("Could not save the new image.");
      const { image } = await add.json();
      const old = row.images[0];
      if (old) {
        await fetch(`/api/admin/products/${row.id}/images`, {
          method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageId: old.id }),
        });
      }
      setRows((rs) => rs.map((x) => (x.id === row.id ? { ...x, images: [{ id: image.id, url: image.url, cloudinaryId: image.cloudinaryId }] } : x)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not replace the image.");
    }
    setBusy(null);
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
        <Link prefetch={false} href="/desk/review" className="h-9 px-4 bg-primary text-white text-sm font-medium rounded-md flex items-center gap-2 hover:bg-primary-active transition-colors">
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

      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-on-dark-soft"><Loader2 size={16} className="animate-spin" /> Loading…</div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-on-dark-soft text-center py-12 bg-surface-dark-elevated rounded-xl border border-white/8">Nothing to fix. Disapproved products from review show up here.</p>
      ) : (
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" data-testid="fix-list">
          {rows.map((r) => <FixCard key={r.id} r={r} busy={busy === r.id} onReplace={(f) => replaceImage(r, f)} onFixed={() => markFixed(r.id)} />)}
        </div>
      )}
    </div>
  );
}

function FixCard({ r, busy, onReplace, onFixed }: { r: Row; busy: boolean; onReplace: (f: File) => void; onFixed: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden flex flex-col">
      <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} aria-label={`Replace image for ${r.title}`}
        className="relative aspect-[3/4] w-full bg-white/5 flex items-center justify-center group disabled:cursor-wait">
        {r.images[0]
          ? <Image src={r.images[0].url} alt={r.title} fill sizes="(max-width: 480px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover" />
          : <span className="flex flex-col items-center gap-1 text-on-dark-soft text-xs"><ImageOff size={24} />No image</span>}
        {busy && <span className="absolute inset-0 bg-black/60 flex items-center justify-center"><Loader2 size={24} className="animate-spin text-white" /></span>}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onReplace(f); }} />
      <div className="p-3 flex flex-col gap-3 flex-1">
        <div className="min-w-0">
          <p className="text-sm text-on-dark line-clamp-2">{r.title}</p>
          <p className="text-[11px] text-on-dark-soft mt-0.5">
            <span className="font-mono">{r.sku ?? "—"}</span> · {TYPE_LABEL[r.type] ?? r.type}
            {r.reviewedAt && <> · disapproved {new Date(r.reviewedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{r.reviewedBy ? ` by ${r.reviewedBy}` : ""}</>}
          </p>
        </div>
        <div className="mt-auto flex flex-col gap-2">
          <button onClick={() => fileRef.current?.click()} disabled={busy}
            className="h-11 flex items-center justify-center gap-2 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary-active transition-colors disabled:opacity-50">
            <Camera size={15} /> {r.images[0] ? "Replace image" : "Add image"}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={onFixed} disabled={busy}
              className="h-10 flex items-center justify-center gap-1.5 text-xs rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50">
              <CheckCircle2 size={13} /> Mark fixed
            </button>
            <Link prefetch={false} href={r.type === "book" ? `/admin/books/${r.id}/edit` : `/admin/products/${r.id}/edit`}
              className="h-10 flex items-center justify-center gap-1.5 text-xs rounded-md bg-white/5 text-on-dark-soft hover:bg-white/10 hover:text-on-dark transition-colors">
              <Pencil size={13} /> Edit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
