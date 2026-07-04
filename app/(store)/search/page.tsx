import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { searchProducts, getProducts } from "@/lib/queries";
import { ProductCard } from "@/components/shared/ProductCard";
import { FadeIn } from "@/components/shared/FadeIn";
import { SearchInput } from "@/components/shared/SearchInput";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

const PER_PAGE = 12;

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `"${q}" — Search` : "Search" };
}

async function Results({ q, page }: { q: string; page: number }) {
  const all = q.trim()
    ? await searchProducts(q)
    : await getProducts({ limit: 200 });

  const totalPages = Math.max(1, Math.ceil(all.length / PER_PAGE));
  const safePage   = Math.min(Math.max(1, page), totalPages);
  const paged      = all.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  function pageHref(p: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (p > 1) sp.set("page", String(p));
    return `/search?${sp.toString()}`;
  }

  return (
    <>
      <div className="flex items-center pb-7 mb-8 border-b border-hairline">
        <p className="text-sm text-muted">
          {all.length} result{all.length !== 1 ? "s" : ""}
          {q ? <> for <span className="text-ink font-medium">&ldquo;{q}&rdquo;</span></> : ""}
        </p>
      </div>

      {paged.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
          {paged.map((p, i) => (
            <FadeIn key={p.id} delay={Math.min(i, 7) * 60}>
              <ProductCard product={p} />
            </FadeIn>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center">
          <p className="text-sm text-body">No results for &ldquo;{q}&rdquo;</p>
          <p className="text-xs text-body mt-1.5">Try a different word or browse categories.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-14">
          <Link href={pageHref(safePage - 1)} aria-disabled={safePage === 1}
            className={`w-9 h-9 flex items-center justify-center border border-hairline text-muted hover:text-ink transition-colors ${safePage === 1 ? "pointer-events-none opacity-25" : ""}`}>
            <ChevronLeft size={14} />
          </Link>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pg => (
            <Link key={pg} href={pageHref(pg)}
              className={`w-9 h-9 flex items-center justify-center text-[13px] font-medium border transition-colors ${pg === safePage ? "bg-ink text-on-dark border-ink" : "border-hairline text-muted hover:text-ink"}`}>
              {pg}
            </Link>
          ))}
          <Link href={pageHref(safePage + 1)} aria-disabled={safePage === totalPages}
            className={`w-9 h-9 flex items-center justify-center border border-hairline text-muted hover:text-ink transition-colors ${safePage === totalPages ? "pointer-events-none opacity-25" : ""}`}>
            <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </>
  );
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", page: pageStr = "1" } = await searchParams;
  const page = parseInt(pageStr, 10) || 1;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      <nav className="flex items-center gap-2 text-xs text-muted mb-7">
        <Link href="/" className="hover:text-ink transition-colors">Home</Link>
        <span className="text-hairline">/</span>
        <span className="text-ink font-medium">Search</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-[38px] font-normal leading-tight mb-6" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.4px" }}>
          Search
        </h1>
        <Suspense>
          <SearchInput defaultValue={q} />
        </Suspense>
      </div>

      <Suspense fallback={<div className="text-sm text-muted py-8">Searching…</div>}>
        <Results q={q} page={page} />
      </Suspense>
    </div>
  );
}
