"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { featuredProducts } from "@/data/mock";
import { ProductCard } from "@/components/shared/ProductCard";

const PER_PAGE = 12;

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [page, setPage]   = useState(1);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return featuredProducts;
    return featuredProducts.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.author?.toLowerCase().includes(q) ||
      p.genre?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(results.length / PER_PAGE));
  const paged = results.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function handleQuery(q: string) { setQuery(q); setPage(1); }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted mb-7">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <span className="text-hairline">/</span>
        <span className="text-ink font-medium">Search</span>
      </nav>

      {/* Search heading + input */}
      <div className="mb-8">
        <h1
          className="text-[38px] font-normal leading-tight mb-6"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.4px" }}
        >
          Search
        </h1>
        <div className="relative max-w-lg">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="search"
            placeholder="Search books, gifts, authors…"
            value={query}
            onChange={(e) => handleQuery(e.target.value)}
            autoFocus
            className="w-full h-12 pl-11 pr-4 text-sm border border-hairline bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center pb-7 mb-8 border-b border-hairline">
        <p className="text-sm text-muted">
          {results.length} result{results.length !== 1 ? "s" : ""}
          {query.trim() ? <> for <span className="text-ink font-medium">"{query.trim()}"</span></> : ""}
        </p>
      </div>

      {/* Grid */}
      {paged.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
          {paged.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="py-24 text-center">
          <p className="text-sm text-body">No results for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-body mt-1.5">Try a different word or browse categories.</p>
        </div>
      )}

      {/* Pagination */}
      {results.length > 0 && (
        <div className="flex items-center justify-center gap-1 mt-14">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-9 h-9 flex items-center justify-center border border-hairline text-muted hover:text-ink disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
            <button
              key={pg}
              onClick={() => setPage(pg)}
              className={`w-9 h-9 flex items-center justify-center text-[13px] font-medium border transition-colors ${
                pg === page ? "bg-ink text-on-dark border-ink" : "border-hairline text-muted hover:text-ink"
              }`}
            >
              {pg}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-9 h-9 flex items-center justify-center border border-hairline text-muted hover:text-ink disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
