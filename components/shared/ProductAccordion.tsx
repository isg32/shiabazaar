"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

interface Item {
  title: string;
  content: ReactNode;
}

export function ProductAccordion({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-hairline border-y border-hairline">
      {items.map((item, i) => (
        <div key={item.title}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between py-4 text-left group"
          >
            <span className="font-medium text-ink group-hover:text-primary transition-colors">
              {item.title}
            </span>
            <ChevronDown
              size={16}
              className={`text-muted transition-transform duration-200 shrink-0 ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          <div
            className={`grid transition-all duration-200 ${open === i ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
          >
            <div className="overflow-hidden">
              <div className="pb-6 text-sm text-body leading-relaxed">{item.content}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
