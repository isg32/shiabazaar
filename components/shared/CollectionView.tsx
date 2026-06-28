"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/data/mock";

const PRICE_FILTERS = [
  { label: "All prices", value: "all" },
  { label: "Under ₹299", value: "u299" },
  { label: "₹300–₹599", value: "300-599" },
  { label: "₹600–₹999", value: "600-999" },
  { label: "₹1000+", value: "1000p" },
];

const SORT_OPTIONS = [
  { label: "Newest first", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
  { label: "Best Rated", value: "rating" },
];

const PER_PAGE = 12;

interface CollectionViewProps {
  label: string;
  /** Breadcrumb trail, last item is current page */
  crumbs: { label: string; href?: string }[];
  products: Product[];
}

function priceMatches(price: number, filter: string) {
  if (filter === "u299")    return price < 299;
  if (filter === "300-599") return price >= 300 && price <= 599;
  if (filter === "600-999") return price >= 600 && price <= 999;
  if (filter === "1000p")   return price >= 1000;
  return true;
}

export function CollectionView({ label, crumbs, products }: CollectionViewProps) {
  const [priceFilter, setPriceFilter] = useState("all");
  const [sort, setSort]               = useState("newest");
  const [page, setPage]               = useState(1);

  const filtered = useMemo(() => {
    let list = products.filter((p) => priceMatches(p.price, priceFilter));
    if (sort === "price-asc")  list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "rating")     list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [products, priceFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function applyFilter(val: string) { setPriceFilter(val); setPage(1); }
  function applySort(val: string)   { setSort(val);         setPage(1); }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-muted mb-7">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-hairline select-none">/</span>}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-ink transition-colors">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-ink font-medium">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Heading */}
      <div className="mb-8">
        <h1
          className="text-[38px] font-normal leading-tight"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.4px" }}
        >
          {label}
        </h1>
        <p className="text-sm text-muted mt-1.5">
          {filtered.length} product{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-7 mb-8 border-b border-hairline">
        <div className="flex items-center gap-1.5 flex-wrap">
          {PRICE_FILTERS.map(({ label: fl, value }) => (
            <button
              key={value}
              onClick={() => applyFilter(value)}
              className={`text-[12px] px-3.5 py-2 border font-medium tracking-wide transition-colors ${
                priceFilter === value
                  ? "bg-ink text-on-dark border-ink"
                  : "bg-canvas border-hairline text-muted hover:text-ink hover:border-body/30"
              }`}
            >
              {fl}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => applySort(e.target.value)}
          className="text-[12px] border border-hairline px-3 py-2 bg-canvas text-ink focus:outline-none focus:border-primary cursor-pointer"
        >
          {SORT_OPTIONS.map(({ label: sl, value }) => (
            <option key={value} value={value}>{sl}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {paged.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
          {paged.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="py-24 text-center">
          <p className="text-sm text-muted">No products match this filter.</p>
          <button
            onClick={() => applyFilter("all")}
            className="mt-4 text-xs text-primary hover:text-primary-active underline underline-offset-2"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Pagination */}
      {products.length > 0 && (
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
                pg === page
                  ? "bg-ink text-on-dark border-ink"
                  : "border-hairline text-muted hover:text-ink"
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
