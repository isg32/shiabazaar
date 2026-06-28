import { Pencil, Trash2, Plus, Eye, EyeOff, GripVertical } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Homepage" };

const banners = [
  { id: 1, title: "Eid al-Adha Collection", subtitle: "New arrivals — books, gifts & more", cta: "Shop Now", active: true  },
  { id: 2, title: "Muharram Special",        subtitle: "Exclusive titles for the new year",  cta: "Explore", active: false },
];

const featured = [
  { id: 1, name: "Nahjul Balagha",           type: "Book",  price: "₹620",   pinned: true  },
  { id: 2, name: "Tafseer e Namoona Vol 1",  type: "Book",  price: "₹480",   pinned: true  },
  { id: 3, name: "Alam Panja (Brass Large)", type: "Gift",  price: "₹1,200", pinned: true  },
  { id: 4, name: "Mashak Brass Small",       type: "Gift",  price: "₹890",   pinned: true  },
  { id: 5, name: "Prayer Mat — Ladies",      type: "Ladies",price: "₹350",   pinned: false },
  { id: 6, name: "Hijab — Chiffon Cream",    type: "Ladies",price: "₹280",   pinned: false },
];

const popups = [
  { id: 1, title: "10% off your first order", code: "WELCOME10", trigger: "On page load", delay: "3s", active: true  },
  { id: 2, title: "Eid Sale — 20% off",       code: "EID2025",   trigger: "Exit intent",   delay: "—",  active: false },
];

export default function AdminHomepage() {
  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-on-dark">Homepage</h1>
        <p className="text-sm text-on-dark-soft mt-0.5">Manage hero banners, featured products, and popups</p>
      </div>

      {/* ── Hero Banners ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-on-dark">Hero Banners</h2>
          <button className="h-8 px-3 text-xs bg-primary text-white rounded-md flex items-center gap-1.5 hover:bg-primary-active transition-colors">
            <Plus size={12} /> Add Banner
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {banners.map(b => (
            <div key={b.id} className="bg-surface-dark-elevated border border-white/8 rounded-xl px-5 py-4 flex items-center gap-4">
              <GripVertical size={14} className="text-on-dark-soft cursor-grab shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-on-dark font-medium">{b.title}</p>
                <p className="text-xs text-on-dark-soft mt-0.5">{b.subtitle} · CTA: "{b.cta}"</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${b.active ? "bg-success/12 text-success" : "bg-white/8 text-on-dark-soft"}`}>
                  {b.active ? "Live" : "Draft"}
                </span>
                <button className="w-7 h-7 flex items-center justify-center rounded text-on-dark-soft hover:text-on-dark hover:bg-white/8 transition-colors">
                  {b.active ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <button className="w-7 h-7 flex items-center justify-center rounded text-on-dark-soft hover:text-on-dark hover:bg-white/8 transition-colors">
                  <Pencil size={13} />
                </button>
                <button className="w-7 h-7 flex items-center justify-center rounded text-on-dark-soft hover:text-error hover:bg-error/10 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-on-dark">Featured Products</h2>
          <button className="h-8 px-3 text-xs bg-primary text-white rounded-md flex items-center gap-1.5 hover:bg-primary-active transition-colors">
            <Plus size={12} /> Add Product
          </button>
        </div>
        <div className="bg-surface-dark-elevated border border-white/8 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {["", "Product", "Type", "Price", "Pinned", ""].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featured.map((p, i) => (
                <tr key={p.id} className={`hover:bg-white/3 transition-colors ${i < featured.length - 1 ? "border-b border-white/8" : ""}`}>
                  <td className="px-4 py-3.5 w-6"><GripVertical size={14} className="text-on-dark-soft cursor-grab" /></td>
                  <td className="px-4 py-3.5 text-on-dark font-medium">{p.name}</td>
                  <td className="px-4 py-3.5"><span className="text-xs px-2 py-0.5 rounded bg-white/5 text-on-dark-soft">{p.type}</span></td>
                  <td className="px-4 py-3.5 text-on-dark">{p.price}</td>
                  <td className="px-4 py-3.5">
                    <div className={`w-8 h-4 rounded-full transition-colors ${p.pinned ? "bg-primary" : "bg-white/15"}`} />
                  </td>
                  <td className="px-4 py-3.5">
                    <button className="w-7 h-7 flex items-center justify-center rounded text-on-dark-soft hover:text-error hover:bg-error/10 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Popups ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-on-dark">Popups</h2>
          <button className="h-8 px-3 text-xs bg-primary text-white rounded-md flex items-center gap-1.5 hover:bg-primary-active transition-colors">
            <Plus size={12} /> Add Popup
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {popups.map(p => (
            <div key={p.id} className="bg-surface-dark-elevated border border-white/8 rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-on-dark font-medium">{p.title}</p>
                <p className="text-xs text-on-dark-soft mt-0.5">
                  Code: <span className="font-mono text-accent-amber">{p.code}</span> · Trigger: {p.trigger} · Delay: {p.delay}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.active ? "bg-success/12 text-success" : "bg-white/8 text-on-dark-soft"}`}>
                  {p.active ? "Active" : "Inactive"}
                </span>
                <button className="w-7 h-7 flex items-center justify-center rounded text-on-dark-soft hover:text-on-dark hover:bg-white/8 transition-colors">
                  <Pencil size={13} />
                </button>
                <button className="w-7 h-7 flex items-center justify-center rounded text-on-dark-soft hover:text-error hover:bg-error/10 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
