"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

export function SearchInput({ defaultValue }: { defaultValue: string }) {
  const router    = useRouter();
  const pathname  = usePathname();
  const params    = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const timer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  function handleChange(q: string) {
    setValue(q);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const sp = new URLSearchParams(params.toString());
      if (q.trim()) sp.set("q", q.trim());
      else sp.delete("q");
      sp.delete("page");
      router.push(`${pathname}?${sp.toString()}`);
    }, 350);
  }

  return (
    <div className="relative max-w-[640px]">
      <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      <input
        type="search"
        placeholder="Search books, gifts, authors…"
        value={value}
        onChange={e => handleChange(e.target.value)}
        autoFocus
        className="w-full h-12 pl-11 pr-4 text-sm border border-hairline bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
      />
    </div>
  );
}
