"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, RotateCcw } from "lucide-react";
import { DEFAULT_PRESET, PRESETS } from "@/lib/bi/period";

export type CategoryOption = { id: string; label: string };

const ctl = "h-8 px-2 text-xs bg-surface-dark-elevated border border-white/15 rounded-md text-on-dark focus:outline-none focus:border-primary";

/**
 * The dashboard's one global filter row. Everything below it re-renders against
 * the same URL slice; while it refetches, the previous render stays visible at
 * reduced opacity (no skeleton flash).
 */
export default function FilterBar({
  categories,
  showCategory = true,
  children,
}: {
  categories?: CategoryOption[];
  showCategory?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  const get = (k: string) => sp.get(k) ?? "";
  const range = get("range") || DEFAULT_PRESET;
  const dirty = ["range", "from", "to", "channel", "buyer", "cat"].some((k) => sp.has(k));

  function set(patch: Record<string, string | null>) {
    const q = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) q.set(k, v);
      else q.delete(k);
    }
    q.delete("page");
    if ("range" in patch) q.delete("grain");
    startTransition(() => router.push(q.toString() ? `${pathname}?${q}` : pathname));
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-6" data-testid="filter-bar">
        <select aria-label="Date range" value={range} className={ctl}
          onChange={(e) => set({ range: e.target.value, ...(e.target.value === "custom" ? {} : { from: null, to: null }) })}>
          {PRESETS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
        </select>
        {range === "custom" && (
          <>
            <input type="date" aria-label="From date" value={get("from")} className={ctl} onChange={(e) => set({ from: e.target.value })} />
            <span className="text-xs text-on-dark-soft">to</span>
            <input type="date" aria-label="To date" value={get("to")} className={ctl} onChange={(e) => set({ to: e.target.value })} />
          </>
        )}
        <select aria-label="Sales channel" value={get("channel")} className={ctl} onChange={(e) => set({ channel: e.target.value || null })}>
          <option value="">All channels</option>
          <option value="online">Website</option>
          <option value="offline">Physical store</option>
        </select>
        <select aria-label="Buyer type" value={get("buyer")} className={ctl} onChange={(e) => set({ buyer: e.target.value || null })}>
          <option value="">All buyers</option>
          <option value="individual">Individual</option>
          <option value="school">School</option>
          <option value="vendor">Vendor</option>
        </select>
        {showCategory && categories && (
          <select aria-label="Category" value={get("cat")} className={`${ctl} max-w-56`} onChange={(e) => set({ cat: e.target.value || null })}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        )}
        {dirty && (
          <button onClick={() => set({ range: null, from: null, to: null, channel: null, buyer: null, cat: null })}
            className="h-8 px-2 text-xs text-on-dark-soft hover:text-on-dark flex items-center gap-1">
            <RotateCcw size={12} /> Reset
          </button>
        )}
        {pending && <Loader2 size={14} className="animate-spin text-on-dark-soft" aria-label="Updating" />}
      </div>
      <div className={`transition-opacity ${pending ? "opacity-50" : ""}`}>{children}</div>
    </>
  );
}
