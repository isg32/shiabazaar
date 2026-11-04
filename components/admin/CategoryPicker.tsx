"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { CategoryNode } from "@/lib/category-tree";

/**
 * Shared category tag-picker for the product/book admin forms. Shows the
 * group's category tree as clickable buttons (indented by depth), with a
 * search box to narrow a long list and a comma-separated quick-add field for
 * assigning several categories by name at once without hunting through the
 * button grid — e.g. typing "Fiqh, Tafsir, Hadith" and pressing Enter selects
 * all three in one go (matched by exact name, case-insensitive).
 */
export function CategoryPicker({
  items,
  selected,
  onChange,
}: {
  items: { node: CategoryNode; depth: number }[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [query, setQuery] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const filtered = q ? items.filter(({ node }) => node.name.toLowerCase().includes(q)) : items;

  function toggle(id: string) {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    onChange(s);
  }

  function applyBulk() {
    const names = bulkText.split(",").map((s) => s.trim()).filter(Boolean);
    if (names.length === 0) return;
    const s = new Set(selected);
    let addedCount = 0;
    const unmatched: string[] = [];
    for (const name of names) {
      const match = items.find(({ node }) => node.name.toLowerCase() === name.toLowerCase());
      if (match) {
        if (!s.has(match.node.id)) addedCount++;
        s.add(match.node.id);
      } else {
        unmatched.push(name);
      }
    }
    onChange(s);
    setBulkText("");
    setBulkMsg(
      unmatched.length > 0
        ? `Added ${addedCount}. Not found: ${unmatched.join(", ")}`
        : `Added ${addedCount} categor${addedCount === 1 ? "y" : "ies"}.`
    );
    setTimeout(() => setBulkMsg(null), 5000);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <div className="relative flex-1 min-w-0">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-dark-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories…"
            className="w-full h-8 pl-7 pr-2 text-xs bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2 flex-1 min-w-0">
          <input
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyBulk();
              }
            }}
            placeholder="Quick-add: Fiqh, Tafsir, Hadith…"
            className="flex-1 min-w-0 h-8 px-2 text-xs bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft/50 focus:outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={applyBulk}
            disabled={!bulkText.trim()}
            className="h-8 px-3 text-xs font-medium bg-white/8 hover:bg-white/12 text-on-dark rounded-md disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
          >
            Add
          </button>
        </div>
      </div>
      {bulkMsg && <p className="text-[11px] text-accent-amber mb-2">{bulkMsg}</p>}
      <div className="flex flex-wrap gap-2 p-3 bg-surface-dark-elevated rounded-md border border-white/10 min-h-[60px]">
        {filtered.length === 0 ? (
          <span className="text-xs text-on-dark-soft/50">
            {items.length === 0 ? "No categories yet." : `No categories match "${query}".`}
          </span>
        ) : (
          filtered.map(({ node, depth }) => (
            <button
              key={node.id}
              type="button"
              onClick={() => toggle(node.id)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                selected.has(node.id)
                  ? "bg-primary text-white"
                  : "bg-white/10 text-on-dark-soft hover:bg-white/15"
              }`}
            >
              {depth > 0 ? "-".repeat(depth) + " " : ""}
              {node.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
