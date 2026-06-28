import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { featuredProducts } from "@/data/mock";
import { Badge } from "@/components/shared/Badge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Products" };

export default function AdminProductsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Products</h1>
        <button className="inline-flex items-center gap-2 h-9 px-4 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors">
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["All","Books","Gifts","Ladies","Gents","In Stock","Out of Stock"].map((f, i) => (
          <button key={f} className={`text-xs px-3 py-1.5 rounded-md border font-medium transition-colors ${i === 0 ? "bg-surface-cream-strong border-hairline text-ink" : "bg-canvas border-hairline text-muted hover:text-ink"}`}>
            {f}
          </button>
        ))}
        <input
          type="search"
          placeholder="Search products..."
          className="ml-auto h-8 px-3 text-xs border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary w-48"
        />
      </div>

      {/* Table */}
      <div className="bg-canvas rounded-xl border border-hairline overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline">
              {["Product","Type","Price","Stock","Status","Actions"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {featuredProducts.map((p) => (
              <tr key={p.id} className="hover:bg-surface-soft transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-9 h-12 rounded-md overflow-hidden bg-surface-card shrink-0">
                      <Image src={p.coverImage} alt={p.title} fill className="object-cover" sizes="36px" />
                    </div>
                    <div>
                      <p className="font-medium text-ink text-xs leading-snug max-w-[160px] truncate">{p.title}</p>
                      {p.author && <p className="text-xs text-muted mt-0.5 truncate max-w-[160px]">{p.author}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs text-muted capitalize">{p.type}</span>
                </td>
                <td className="px-5 py-3 font-medium text-ink">₹{p.price}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium ${p.inStock ? "text-success" : "text-error"}`}>
                    {p.inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {p.badge && <Badge label={p.badge} />}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button className="w-7 h-7 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-surface-card transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-md text-muted hover:text-error hover:bg-error/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
