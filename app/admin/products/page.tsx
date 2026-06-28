import { Plus, Search, Pencil, Trash2, Filter } from "lucide-react";
import { Badge } from "@/components/shared/Badge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Products" };

const products = [
  { id: 1,  name: "Nahjul Balagha",            type: "Book",   price: "₹620",   stock: 24, status: "Active",      img: "📗" },
  { id: 2,  name: "Tafseer e Namoona Vol 1",   type: "Book",   price: "₹480",   stock: 18, status: "Active",      img: "📘" },
  { id: 3,  name: "Tafseer e Namoona Vol 2",   type: "Book",   price: "₹480",   stock: 9,  status: "Active",      img: "📘" },
  { id: 4,  name: "Tafseer e Saafi Vol 1",     type: "Book",   price: "₹540",   stock: 14, status: "Active",      img: "📙" },
  { id: 5,  name: "Tafseer e Saafi Vol 3",     type: "Book",   price: "₹540",   stock: 3,  status: "Low Stock",   img: "📙" },
  { id: 6,  name: "Alam Panja (Brass Large)",  type: "Gift",   price: "₹1,200", stock: 7,  status: "Active",      img: "🏮" },
  { id: 7,  name: "Alam Panja (Brass Small)",  type: "Gift",   price: "₹850",   stock: 12, status: "Active",      img: "🏮" },
  { id: 8,  name: "Alam Patka (Small)",        type: "Gift",   price: "₹620",   stock: 2,  status: "Low Stock",   img: "🏮" },
  { id: 9,  name: "Mashak Brass Small",        type: "Gift",   price: "₹890",   stock: 15, status: "Active",      img: "🫙" },
  { id: 10, name: "Islamic Mug — Bismillah",   type: "Gift",   price: "₹350",   stock: 0,  status: "Out of Stock",img: "☕" },
  { id: 11, name: "Prayer Mat — Ladies Floral",type: "Ladies", price: "₹350",   stock: 20, status: "Active",      img: "🟫" },
  { id: 12, name: "Abaya — Black (M)",         type: "Ladies", price: "₹1,800", stock: 8,  status: "Active",      img: "👗" },
  { id: 13, name: "Hijab — Chiffon Cream",     type: "Ladies", price: "₹280",   stock: 35, status: "Active",      img: "🧣" },
  { id: 14, name: "Gents Kurta — White",       type: "Gents",  price: "₹950",   stock: 1,  status: "Low Stock",   img: "👔" },
  { id: 15, name: "Attar — Oud Rose 6ml",      type: "Gents",  price: "₹420",   stock: 22, status: "Active",      img: "🌹" },
];

const statusStyles: Record<string, string> = {
  "Active":       "bg-success/10 text-success",
  "Low Stock":    "bg-accent-amber/15 text-accent-amber",
  "Out of Stock": "bg-error/10 text-error",
};

const types = ["All", "Book", "Gift", "Ladies", "Gents"];

export default function AdminProducts() {
  return (
    <div className="px-8 py-8 text-on-dark">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Products</h1>
          <p className="text-sm text-on-dark-soft mt-0.5">{products.length} products total</p>
        </div>
        <button className="h-9 px-4 bg-primary text-white text-sm font-medium rounded-md flex items-center gap-2 hover:bg-primary-active transition-colors">
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-dark-soft" />
          <input
            type="text"
            placeholder="Search products…"
            className="w-full h-9 pl-9 pr-3 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-1 bg-surface-dark-elevated border border-white/8 rounded-md p-0.5">
          {types.map(t => (
            <button key={t} className={`px-3 h-7 text-xs font-medium rounded transition-colors ${t === "All" ? "bg-white/10 text-on-dark" : "text-on-dark-soft hover:text-on-dark"}`}>
              {t}
            </button>
          ))}
        </div>
        <button className="h-9 px-3 flex items-center gap-1.5 text-sm text-on-dark-soft bg-surface-dark-elevated border border-white/8 rounded-md hover:text-on-dark transition-colors">
          <Filter size={13} /> Filter
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide w-8">
                <input type="checkbox" className="rounded" />
              </th>
              {["Product", "Type", "Price", "Stock", "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr key={p.id} className={`hover:bg-white/3 transition-colors ${i < products.length - 1 ? "border-b border-white/8" : ""}`}>
                <td className="px-5 py-3.5">
                  <input type="checkbox" className="rounded" />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{p.img}</span>
                    <span className="text-on-dark font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-on-dark-soft font-medium">{p.type}</span>
                </td>
                <td className="px-4 py-3.5 text-on-dark font-medium">{p.price}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-xs font-medium ${p.stock === 0 ? "text-error" : p.stock <= 3 ? "text-accent-amber" : "text-success"}`}>
                    {p.stock === 0 ? "Out of stock" : `${p.stock} units`}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${statusStyles[p.status]}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <button className="w-7 h-7 flex items-center justify-center rounded text-on-dark-soft hover:text-on-dark hover:bg-white/8 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded text-on-dark-soft hover:text-error hover:bg-error/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-white/8 flex items-center justify-between">
          <span className="text-xs text-on-dark-soft">Showing 1–{products.length} of {products.length}</span>
          <div className="flex items-center gap-1">
            <button className="h-7 px-3 text-xs text-on-dark-soft bg-white/5 rounded hover:bg-white/10 transition-colors">Prev</button>
            <button className="h-7 px-3 text-xs text-on-dark bg-white/12 rounded">1</button>
            <button className="h-7 px-3 text-xs text-on-dark-soft bg-white/5 rounded hover:bg-white/10 transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
