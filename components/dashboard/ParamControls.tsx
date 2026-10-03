"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";

const ctl = "h-8 px-2 text-xs bg-surface-dark-elevated border border-white/15 rounded-md text-on-dark focus:outline-none focus:border-primary";

function useParam() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const set = (k: string, v: string) => {
    const q = new URLSearchParams(sp.toString());
    if (v) q.set(k, v); else q.delete(k);
    start(() => router.push(q.toString() ? `${pathname}?${q}` : pathname));
  };
  return { sp, set, pending };
}

/** A select bound to one URL search param. */
export function ParamSelect({ name, label, options }: { name: string; label: string; options: [string, string][] }) {
  const { sp, set, pending } = useParam();
  return (
    <span className="inline-flex items-center gap-1">
      <select aria-label={label} value={sp.get(name) ?? ""} onChange={(e) => set(name, e.target.value)} className={ctl}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      {pending && <Loader2 size={12} className="animate-spin text-on-dark-soft" />}
    </span>
  );
}

/** A search box bound to one URL search param (applies on Enter). */
export function ParamSearch({ name, placeholder }: { name: string; placeholder: string }) {
  const { sp, set } = useParam();
  const [v, setV] = useState(sp.get(name) ?? "");
  return (
    <form onSubmit={(e) => { e.preventDefault(); set(name, v.trim()); }} className="relative">
      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-dark-soft" />
      <input aria-label={placeholder} value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder}
        className={`${ctl} pl-7 w-56`} />
    </form>
  );
}
