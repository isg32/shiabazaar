"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";

type Book = {
  id: string; title: string; slug: string; author: string | null;
  publisher: string | null; price: number; inStock: boolean;
  category: { name: string } | null;
};

export default function AdminBooks() {
  const [books,   setBooks]   = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/products")
      .then(r => r.json())
      .then(d => {
        setBooks((d.products ?? []).filter((p: Book & { type: string }) => p.type === "book"));
        setLoading(false);
      });
  }, []);

  const filtered = books.filter(b =>
    !query || b.title.toLowerCase().includes(query.toLowerCase()) ||
    (b.author ?? "").toLowerCase().includes(query.toLowerCase())
  );

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    setBooks(prev => prev.filter(b => b.id !== id));
    setDeleting(null);
  }

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-normal text-on-dark" style={{ fontFamily: "var(--font-display)" }}>Books</h1>
          <p className="text-sm text-on-dark-soft mt-0.5">{books.length} books in catalog</p>
        </div>
        <Link
          href="/admin/books/new"
          className="flex items-center gap-2 h-9 px-4 text-sm font-medium bg-primary text-on-primary rounded-md hover:bg-primary-active transition-colors"
        >
          <Plus size={14} /> Add Book
        </Link>
      </div>

      <div className="relative mb-5">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-dark-soft" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by title or author…"
          className="w-full h-9 pl-9 pr-3 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary"
        />
      </div>

      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-on-dark-soft">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {["Title", "Author", "Publication", "Category", "Price", "Stock", ""].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-on-dark-soft">
                  {books.length === 0 ? "No books yet." : "No books match your search."}
                </td></tr>
              ) : filtered.map((b, i) => (
                <tr key={b.id} className={`hover:bg-white/3 transition-colors ${i < filtered.length - 1 ? "border-b border-white/8" : ""}`}>
                  <td className="px-5 py-3.5 font-medium text-on-dark max-w-[200px] truncate">{b.title}</td>
                  <td className="px-5 py-3.5 text-on-dark-soft max-w-[140px] truncate">{b.author ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    {b.publisher ? (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${b.publisher === "Tazeem Publication" ? "bg-primary/15 text-primary" : "bg-white/5 text-on-dark-soft"}`}>
                        {b.publisher === "Tazeem Publication" ? "Tazeem" : "Other"}
                      </span>
                    ) : <span className="text-on-dark-soft/40">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-on-dark-soft text-xs">{b.category?.name ?? "—"}</td>
                  <td className="px-5 py-3.5 text-on-dark font-mono text-xs">₹{(b.price / 100).toFixed(0)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium ${b.inStock ? "text-success" : "text-error"}`}>
                      {b.inStock ? "In Stock" : "Out"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <Link href={`/admin/books/${b.id}/edit`}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/8 text-on-dark-soft hover:text-on-dark transition-colors">
                        <Pencil size={13} />
                      </Link>
                      <button onClick={() => remove(b.id, b.title)} disabled={deleting === b.id}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-error/10 text-on-dark-soft/50 hover:text-error transition-colors disabled:opacity-40">
                        {deleting === b.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="px-5 py-3 border-t border-white/8">
          <span className="text-xs text-on-dark-soft">Showing {filtered.length} of {books.length} books</span>
        </div>
      </div>
    </div>
  );
}
