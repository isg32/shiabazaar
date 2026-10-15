"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, X, Undo2, ImageOff, Loader2, PartyPopper } from "lucide-react";

type Product = {
  id: string; title: string; sku: string | null; type: string; price: number; originalPrice: number | null;
  author: string | null; publisher: string | null; language: string | null; description: string | null; slug: string;
  images: { url: string }[];
  categories: { category: { name: string } }[];
};
type Counts = { pending: number; approved: number; rejected: number };
type Decision = "approve" | "reject";
type Filter = "all" | "books" | "other" | "noimage";

const FILTERS: [Filter, string][] = [["all", "All"], ["books", "Books"], ["other", "Other products"], ["noimage", "No image"]];
const TYPE_LABEL: Record<string, string> = { book: "Book", gift: "Gift", ladies: "Ladies", gents: "Gents", other: "Other" };
const BATCH = 15;
const LOW_WATER = 5;
const rs = (p: number) => `₹${(p / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export default function ProductReview() {
  const [filter, setFilter] = useState<Filter>("all");
  const [queue, setQueue] = useState<Product[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [history, setHistory] = useState<{ product: Product; decision: Decision }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [leaving, setLeaving] = useState<{ id: string; dir: Decision } | null>(null);
  const [expanded, setExpanded] = useState(false);

  const fetching = useRef(false);
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const queueRef = useRef<Product[]>([]);
  const historyRef = useRef(history);
  useEffect(() => { queueRef.current = queue; historyRef.current = history; }, [queue, history]);

  const fetchMore = useCallback(async (f: Filter, replace: boolean) => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const exclude = replace ? [] : [...queueRef.current.map((p) => p.id), ...historyRef.current.slice(-30).map((h) => h.product.id)];
      const res = await fetch(`/api/desk/review/queue?filter=${f}&take=${BATCH}&exclude=${exclude.join(",")}`);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Could not load products.");
      const d: { products: Product[]; remaining: number; counts: Counts } = await res.json();
      setCounts(d.counts);
      setRemaining(d.remaining);
      setQueue((q) => {
        const base = replace ? [] : q;
        const seen = new Set(base.map((p) => p.id));
        return [...base, ...d.products.filter((p) => !seen.has(p.id))];
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load products.");
    } finally {
      fetching.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchMore("all", true); }, [fetchMore]);

  function changeFilter(f: Filter) {
    if (f === filter) return;
    setFilter(f);
    setLoading(true);
    setQueue([]);
    queueRef.current = [];
    setExpanded(false);
    void fetchMore(f, true);
  }

  // Keep a few cards ahead so the next one is always ready.
  useEffect(() => {
    if (!loading && queue.length <= LOW_WATER && remaining !== null && remaining > queue.length) void fetchMore(filter, false);
  }, [queue.length, remaining, loading, filter, fetchMore]);

  const decide = useCallback((dir: Decision) => {
    const product = queueRef.current[0];
    if (!product || leaving) return;
    setError(null);
    setLeaving({ id: product.id, dir });
    const finish = () => {
      setQueue((q) => q.filter((p) => p.id !== product.id));
      setHistory((h) => [...h.slice(-49), { product, decision: dir }]);
      setCounts((c) => c && { ...c, pending: c.pending - 1, [dir === "approve" ? "approved" : "rejected"]: c[dir === "approve" ? "approved" : "rejected"] + 1 });
      setRemaining((r) => (r === null ? r : r - 1));
      setLeaving(null);
      setDrag({ x: 0, y: 0, active: false });
      setExpanded(false);
    };
    setTimeout(finish, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220);

    fetch(`/api/desk/review/${product.id}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision: dir }),
    }).then(async (res) => {
      if (res.ok) return;
      throw new Error((await res.json().catch(() => ({}))).error ?? "Could not save.");
    }).catch((e) => {
      // Roll back: put the card back on top.
      setHistory((h) => h.filter((x) => x.product.id !== product.id));
      setQueue((q) => [product, ...q.filter((p) => p.id !== product.id)]);
      setCounts((c) => c && { ...c, pending: c.pending + 1, [dir === "approve" ? "approved" : "rejected"]: c[dir === "approve" ? "approved" : "rejected"] - 1 });
      setRemaining((r) => (r === null ? r : r + 1));
      setError(`${e instanceof Error ? e.message : "Could not save."} The product is back on top.`);
    });
  }, [leaving]);

  const undo = useCallback(() => {
    const last = historyRef.current[historyRef.current.length - 1];
    if (!last || leaving) return;
    setError(null);
    setHistory((h) => h.slice(0, -1));
    setQueue((q) => [last.product, ...q.filter((p) => p.id !== last.product.id)]);
    const key = last.decision === "approve" ? "approved" : "rejected";
    setCounts((c) => c && { ...c, pending: c.pending + 1, [key]: c[key] - 1 });
    setRemaining((r) => (r === null ? r : r + 1));
    fetch(`/api/desk/review/${last.product.id}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision: "undo" }),
    }).then(async (res) => {
      if (res.ok) return;
      throw new Error((await res.json().catch(() => ({}))).error ?? "Could not undo.");
    }).catch((e) => {
      setQueue((q) => q.filter((p) => p.id !== last.product.id));
      setCounts((c) => c && { ...c, pending: c.pending - 1, [key]: c[key] + 1 });
      setRemaining((r) => (r === null ? r : r - 1));
      setError(e instanceof Error ? e.message : "Could not undo.");
    });
  }, [leaving]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "ArrowRight") { e.preventDefault(); decide("approve"); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); decide("reject"); }
      else if (e.key === "z" || e.key === "Z" || e.key === "Backspace") { e.preventDefault(); undo(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, undo]);

  function onPointerDown(e: React.PointerEvent) {
    if (leaving || (e.target as HTMLElement).closest("button,a")) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    setDrag({ x: 0, y: 0, active: true });
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!start.current) return;
    setDrag({ x: e.clientX - start.current.x, y: e.clientY - start.current.y, active: true });
  }
  function onPointerUp(e: React.PointerEvent) {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dt = Math.max(1, performance.now() - start.current.t);
    start.current = null;
    const width = cardRef.current?.offsetWidth ?? 360;
    const fast = Math.abs(dx / dt) > 0.6 && Math.abs(dx) > 40;
    if (Math.abs(dx) > width * 0.3 || fast) decide(dx > 0 ? "approve" : "reject");
    else setDrag({ x: 0, y: 0, active: false });
  }

  const top = queue[0];
  const reviewed = counts ? counts.approved + counts.rejected : 0;
  const total = counts ? counts.pending + reviewed : 0;
  const stamp = Math.min(Math.abs(drag.x) / 110, 1);

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-8 text-on-dark max-w-[36rem] mx-auto flex flex-col min-h-full">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-on-dark">Review products</h1>
        <p className="text-sm text-on-dark-soft mt-0.5" data-testid="review-counts">
          {counts ? <>{reviewed} of {total} reviewed · <span className="text-success">{counts.approved} approved</span> · <span className="text-error">{counts.rejected} disapproved</span></> : "Loading…"}
        </p>
        {total > 0 && (
          <div className="h-1 rounded-full bg-white/8 overflow-hidden mt-2" aria-hidden>
            <div className="h-full bg-primary" style={{ width: `${(reviewed / total) * 100}%` }} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4" role="group" aria-label="Which products to review">
        {FILTERS.map(([f, label]) => (
          <button key={f} onClick={() => changeFilter(f)} aria-pressed={filter === f}
            className={`h-8 px-3 rounded-full text-xs font-medium transition-colors ${filter === f ? "bg-primary text-white" : "bg-white/5 text-on-dark-soft hover:text-on-dark hover:bg-white/10"}`}>
            {label}
          </button>
        ))}
        {remaining !== null && <span className="ml-auto self-center text-xs text-on-dark-soft" data-testid="remaining">{remaining} left</span>}
      </div>

      {error && <p className="text-sm text-error mb-3" role="alert">{error}</p>}

      <div className="relative flex-1 min-h-[460px]" data-testid="stack">
        {loading && !top ? (
          <div className="absolute inset-0 flex items-center justify-center gap-2 text-on-dark-soft text-sm"><Loader2 size={16} className="animate-spin" /> Loading products…</div>
        ) : !top ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3 px-6" data-testid="review-done">
            <PartyPopper size={32} className="text-primary" />
            <p className="text-lg text-on-dark">Nothing left to review{filter !== "all" ? " in this filter" : ""}.</p>
            <p className="text-sm text-on-dark-soft">Disapproved products wait on the fix-list for an admin to correct.</p>
            {filter !== "all" && <button onClick={() => changeFilter("all")} className="text-sm text-primary hover:text-primary-active">Review all products</button>}
          </div>
        ) : (
          [...queue.slice(0, 3)].reverse().map((p) => {
            const depth = queue.indexOf(p);
            const isTop = depth === 0;
            const out = leaving && leaving.id === p.id;
            const transform = isTop
              ? out
                ? `translate(${leaving.dir === "approve" ? 140 : -140}%, ${drag.y * 0.2}px) rotate(${leaving.dir === "approve" ? 18 : -18}deg)`
                : `translate(${drag.x}px, ${drag.y * 0.2}px) rotate(${drag.x / 22}deg)`
              : `translateY(${depth * 10}px) scale(${1 - depth * 0.04})`;
            return (
              <div
                key={p.id}
                ref={isTop ? cardRef : undefined}
                data-testid={isTop ? "review-card" : undefined}
                data-id={isTop ? p.id : undefined}
                aria-hidden={!isTop}
                onPointerDown={isTop ? onPointerDown : undefined}
                onPointerMove={isTop ? onPointerMove : undefined}
                onPointerUp={isTop ? onPointerUp : undefined}
                onPointerCancel={isTop ? () => { start.current = null; setDrag({ x: 0, y: 0, active: false }); } : undefined}
                className={`absolute inset-0 bg-surface-dark-elevated border border-white/10 rounded-2xl overflow-hidden flex flex-col select-none motion-reduce:!transition-none ${isTop ? "cursor-grab active:cursor-grabbing shadow-xl" : "pointer-events-none"} ${depth === 2 ? "opacity-0" : ""}`}
                style={{
                  transform,
                  opacity: out ? 0 : undefined,
                  transition: isTop && drag.active && !out ? "none" : "transform 220ms ease-out, opacity 220ms ease-out",
                  touchAction: "pan-y",
                  zIndex: 10 - depth,
                }}
              >
                <div className="relative bg-white/5 flex-[1_1_55%] min-h-[200px]">
                  {p.images[0] ? (
                    <Image src={p.images[0].url} alt={p.title} fill sizes="(max-width: 640px) 100vw, 560px" className="object-contain" draggable={false} priority={depth < 2} />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-on-dark-soft" data-testid="no-image">
                      <ImageOff size={36} /><span className="text-sm">No image</span>
                    </div>
                  )}
                  {isTop && (
                    <>
                      <span className="absolute top-5 left-5 -rotate-12 border-[3px] border-success text-success font-bold tracking-widest text-lg px-2 py-0.5 rounded-md"
                        style={{ opacity: drag.x > 0 ? stamp : leaving?.dir === "approve" ? 1 : 0 }}>APPROVE</span>
                      <span className="absolute top-5 right-5 rotate-12 border-[3px] border-error text-error font-bold tracking-widest text-lg px-2 py-0.5 rounded-md"
                        style={{ opacity: drag.x < 0 ? stamp : leaving?.dir === "reject" ? 1 : 0 }}>DISAPPROVE</span>
                    </>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-1.5 overflow-y-auto" style={{ flex: "1 1 45%" }}>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-on-dark-soft">
                    <span className="px-2 py-0.5 rounded-full bg-white/8">{TYPE_LABEL[p.type] ?? p.type}</span>
                    {p.sku && <span className="font-mono">{p.sku}</span>}
                    {p.language && <span>{p.language}</span>}
                  </div>
                  <h2 className="text-lg font-semibold text-on-dark leading-snug" data-testid="card-title">{p.title}</h2>
                  {(p.author || p.publisher) && (
                    <p className="text-xs text-on-dark-soft">{[p.author, p.publisher].filter(Boolean).join(" · ")}</p>
                  )}
                  <p className="text-sm text-on-dark">
                    {rs(p.price)}
                    {p.originalPrice && p.originalPrice > p.price && <span className="ml-2 text-xs text-on-dark-soft line-through">{rs(p.originalPrice)}</span>}
                  </p>
                  {p.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.categories.map((c) => <span key={c.category.name} className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-on-dark-soft">{c.category.name}</span>)}
                    </div>
                  )}
                  {p.description && (
                    <div className="text-xs text-on-dark-soft">
                      <p className={isTop && expanded ? "" : "line-clamp-3"}>{p.description}</p>
                      {isTop && p.description.length > 160 && (
                        <button onClick={() => setExpanded((v) => !v)} className="text-primary hover:text-primary-active mt-0.5">{expanded ? "less" : "more"}</button>
                      )}
                    </div>
                  )}
                  {isTop && (
                    <Link href={`/products/${p.slug}`} target="_blank" className="text-[11px] text-on-dark-soft hover:text-on-dark underline mt-auto self-start">View in shop</Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="sticky bottom-0 pt-5 pb-[max(1rem,env(safe-area-inset-bottom))] flex items-center justify-center gap-6 bg-surface-dark-soft">
        <button onClick={undo} disabled={history.length === 0 || !!leaving} aria-label="Undo last decision"
          className="w-11 h-11 rounded-full bg-white/5 text-on-dark-soft hover:text-on-dark hover:bg-white/10 flex items-center justify-center disabled:opacity-30">
          <Undo2 size={18} />
        </button>
        <button onClick={() => decide("reject")} disabled={!top || !!leaving} aria-label="Disapprove"
          className="w-16 h-16 rounded-full border-2 border-error text-error bg-error/10 hover:bg-error/20 flex items-center justify-center disabled:opacity-30 transition-colors">
          <X size={30} strokeWidth={2.5} />
        </button>
        <button onClick={() => decide("approve")} disabled={!top || !!leaving} aria-label="Approve"
          className="w-16 h-16 rounded-full border-2 border-success text-success bg-success/10 hover:bg-success/20 flex items-center justify-center disabled:opacity-30 transition-colors">
          <Check size={30} strokeWidth={2.5} />
        </button>
      </div>
      <p className="hidden sm:block text-center text-[11px] text-on-dark-soft/70 mt-1">Swipe or drag the card · ← disapprove · → approve · Z undo</p>
    </div>
  );
}
