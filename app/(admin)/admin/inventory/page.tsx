import { featuredProducts } from "@/data/mock";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Inventory" };

export default function AdminInventoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-ink">Inventory</h1>

      <div className="bg-canvas rounded-xl border border-hairline overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline">
              {["Product","Type","Stock Status","Qty","Low Stock Alert","Actions"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {featuredProducts.map((p, i) => {
              const qty = p.inStock ? [24, 8, 3, 56, 12, 2, 44, 0][i % 8] : 0;
              const lowStock = qty > 0 && qty <= 5;
              return (
                <tr key={p.id} className="hover:bg-surface-soft transition-colors">
                  <td className="px-5 py-3 font-medium text-ink text-xs max-w-[180px] truncate">{p.title}</td>
                  <td className="px-5 py-3 text-xs text-muted capitalize">{p.type}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium ${qty > 5 ? "text-success" : qty > 0 ? "text-warning" : "text-error"}`}>
                      {qty > 5 ? "In Stock" : qty > 0 ? "Low Stock" : "Out of Stock"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="number"
                      defaultValue={qty}
                      min={0}
                      className="w-20 h-7 px-2 text-xs border border-hairline rounded-md bg-canvas text-ink focus:outline-none focus:border-primary text-center"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="number"
                      defaultValue={5}
                      min={0}
                      className="w-20 h-7 px-2 text-xs border border-hairline rounded-md bg-canvas text-ink focus:outline-none focus:border-primary text-center"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <button className="text-xs text-primary hover:text-primary-active font-medium">Update</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
