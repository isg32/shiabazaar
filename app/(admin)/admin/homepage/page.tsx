import { Plus, Trash2, GripVertical } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Homepage" };

const banners = [
  { id: 1, title: "Muharram Collection",    image: "banner-muharram.jpg",  active: true,  cta: "Shop Now" },
  { id: 2, title: "New Arrivals — Quran",   image: "banner-quran.jpg",     active: false, cta: "Browse Books" },
];

const popups = [
  { id: 1, title: "10% off your first order", code: "WELCOME", active: true, delay: 5 },
];

export default function AdminHomepagePage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold text-ink">Homepage Editor</h1>

      {/* Hero banners */}
      <section className="bg-canvas rounded-xl border border-hairline overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
          <h2 className="text-sm font-medium text-ink">Hero Banners</h2>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 bg-primary text-on-primary text-xs font-medium rounded-md hover:bg-primary-active transition-colors">
            <Plus size={13} /> Add Banner
          </button>
        </div>
        <div className="divide-y divide-hairline">
          {banners.map((b) => (
            <div key={b.id} className="flex items-center gap-4 px-6 py-4">
              <GripVertical size={16} className="text-muted cursor-grab shrink-0" />
              <div className="w-20 h-12 rounded-lg bg-surface-card border border-hairline flex items-center justify-center shrink-0">
                <span className="text-xs text-muted">img</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{b.title}</p>
                <p className="text-xs text-muted mt-0.5">CTA: {b.cta}</p>
              </div>
              <div className={`w-8 h-4 rounded-full ${b.active ? "bg-success" : "bg-hairline"} relative cursor-pointer shrink-0`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${b.active ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <button className="w-7 h-7 flex items-center justify-center text-muted hover:text-error transition-colors shrink-0">
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
        {/* Upload area */}
        <div className="px-6 py-5 border-t border-hairline">
          <div className="border-2 border-dashed border-hairline rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
            <p className="text-sm text-muted">Drop banner image here or <span className="text-primary">browse</span></p>
            <p className="text-xs text-muted-soft mt-1">PNG, JPG · 1200×480px recommended</p>
          </div>
        </div>
      </section>

      {/* Featured products selector */}
      <section className="bg-canvas rounded-xl border border-hairline p-6">
        <h2 className="text-sm font-medium text-ink mb-4">Featured Products on Homepage</h2>
        <p className="text-xs text-muted mb-4">Select up to 8 products to feature on the homepage grid.</p>
        <div className="flex flex-wrap gap-2">
          {["Nahjul Balagha","Mafatih Al-Jinan","Ya Hussain Mug","Night Lamp","Quran Tajweed","Karbala Book"].map((p, i) => (
            <div key={p} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border ${i < 4 ? "border-primary bg-primary/10 text-primary" : "border-hairline bg-canvas text-muted"}`}>
              {p}
              {i < 4 && <button className="hover:text-error">×</button>}
            </div>
          ))}
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border border-dashed border-hairline text-muted hover:border-primary hover:text-primary transition-colors">
            <Plus size={11} /> Add
          </button>
        </div>
      </section>

      {/* Popups */}
      <section className="bg-canvas rounded-xl border border-hairline overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hairline">
          <h2 className="text-sm font-medium text-ink">Popups</h2>
          <button className="inline-flex items-center gap-1.5 h-8 px-3 bg-primary text-on-primary text-xs font-medium rounded-md hover:bg-primary-active transition-colors">
            <Plus size={13} /> Add Popup
          </button>
        </div>
        {popups.map((p) => (
          <div key={p.id} className="flex items-center gap-4 px-6 py-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{p.title}</p>
              <p className="text-xs text-muted mt-0.5">Code: <span className="font-mono">{p.code}</span> · Delay: {p.delay}s</p>
            </div>
            <div className={`w-8 h-4 rounded-full ${p.active ? "bg-success" : "bg-hairline"} relative cursor-pointer`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${p.active ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <button className="w-7 h-7 flex items-center justify-center text-muted hover:text-error transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </section>

      <div className="flex justify-end">
        <button className="h-10 px-8 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors">
          Save All Changes
        </button>
      </div>
    </div>
  );
}
