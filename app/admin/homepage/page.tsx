"use client";

import { useState, useEffect } from "react";
import { Trash2, Plus, Eye, EyeOff, Loader2, X } from "lucide-react";

type Banner   = { id: string; title: string; subtitle: string | null; ctaLabel: string; ctaUrl: string; active: boolean };
type Popup    = { id: string; title: string; code: string | null; trigger: string; delayMs: number; active: boolean };
type Featured = { id: string; pinned: boolean; product: { id: string; title: string; type: string; price: number } };
type ProductOption = { id: string; title: string; type: string };

const BLANK_BANNER = { title: "", subtitle: "", ctaLabel: "Shop Now", ctaUrl: "/products" };
const BLANK_POPUP  = { title: "", code: "", trigger: "page_load", delayMs: 3000 };

export default function AdminHomepage() {
  const [banners,   setBanners]   = useState<Banner[]>([]);
  const [featured,  setFeatured]  = useState<Featured[]>([]);
  const [popups,    setPopups]    = useState<Popup[]>([]);
  const [products,  setProducts]  = useState<ProductOption[]>([]);
  const [loading,   setLoading]   = useState(true);

  const [showBannerForm, setShowBannerForm] = useState(false);
  const [bannerForm,     setBannerForm]     = useState(BLANK_BANNER);
  const [showPopupForm,  setShowPopupForm]  = useState(false);
  const [popupForm,      setPopupForm]      = useState(BLANK_POPUP);
  const [addFeaturedId,  setAddFeaturedId]  = useState("");
  const [saving,         setSaving]         = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/banners").then(r => r.json()),
      fetch("/api/admin/featured").then(r => r.json()),
      fetch("/api/admin/popups").then(r => r.json()),
      fetch("/api/admin/products").then(r => r.json()),
    ]).then(([b, f, p, pr]) => {
      setBanners(b.banners ?? []);
      setFeatured(f.featured ?? []);
      setPopups(p.popups ?? []);
      setProducts((pr.products ?? []).map((p: { id: string; title: string; type: string }) => ({ id: p.id, title: p.title, type: p.type })));
      setLoading(false);
    });
  }, []);

  async function toggleBanner(id: string, active: boolean) {
    await fetch(`/api/admin/banners/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !active }) });
    setBanners(prev => prev.map(b => b.id === id ? { ...b, active: !active } : b));
  }
  async function deleteBanner(id: string) {
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    setBanners(prev => prev.filter(b => b.id !== id));
  }
  async function saveBanner() {
    if (!bannerForm.title) return;
    setSaving(true);
    const res = await fetch("/api/admin/banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(bannerForm) });
    const d = await res.json();
    setBanners(prev => [...prev, d.banner]);
    setBannerForm(BLANK_BANNER);
    setShowBannerForm(false);
    setSaving(false);
  }

  async function togglePinned(id: string, pinned: boolean) {
    await fetch(`/api/admin/featured/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pinned: !pinned }) });
    setFeatured(prev => prev.map(f => f.id === id ? { ...f, pinned: !pinned } : f));
  }
  async function removeFeatured(id: string) {
    await fetch(`/api/admin/featured/${id}`, { method: "DELETE" });
    setFeatured(prev => prev.filter(f => f.id !== id));
  }
  async function addFeatured() {
    if (!addFeaturedId) return;
    setSaving(true);
    const res = await fetch("/api/admin/featured", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: addFeaturedId }) });
    const d = await res.json();
    if (d.item) setFeatured(prev => [...prev.filter(f => f.product.id !== addFeaturedId), d.item]);
    setAddFeaturedId("");
    setSaving(false);
  }

  async function togglePopup(id: string, active: boolean) {
    await fetch(`/api/admin/popups/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !active }) });
    setPopups(prev => prev.map(p => p.id === id ? { ...p, active: !active } : p));
  }
  async function deletePopup(id: string) {
    await fetch(`/api/admin/popups/${id}`, { method: "DELETE" });
    setPopups(prev => prev.filter(p => p.id !== id));
  }
  async function savePopup() {
    if (!popupForm.title) return;
    setSaving(true);
    const res = await fetch("/api/admin/popups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(popupForm) });
    const d = await res.json();
    setPopups(prev => [d.popup, ...prev]);
    setPopupForm(BLANK_POPUP);
    setShowPopupForm(false);
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-on-dark-soft">
        <Loader2 size={16} className="animate-spin" /> Loading…
      </div>
    );
  }

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
          <button onClick={() => setShowBannerForm(v => !v)} className="h-8 px-3 text-xs bg-primary text-white rounded-md flex items-center gap-1.5 hover:bg-primary-active transition-colors">
            <Plus size={12} /> Add Banner
          </button>
        </div>

        {showBannerForm && (
          <div className="bg-surface-dark-elevated border border-white/8 rounded-xl p-5 mb-3">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input placeholder="Title *" value={bannerForm.title} onChange={e => setBannerForm(f => ({ ...f, title: e.target.value }))}
                className="h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary col-span-2" />
              <input placeholder="Subtitle" value={bannerForm.subtitle} onChange={e => setBannerForm(f => ({ ...f, subtitle: e.target.value }))}
                className="h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary" />
              <input placeholder="CTA Label" value={bannerForm.ctaLabel} onChange={e => setBannerForm(f => ({ ...f, ctaLabel: e.target.value }))}
                className="h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary" />
              <input placeholder="CTA URL" value={bannerForm.ctaUrl} onChange={e => setBannerForm(f => ({ ...f, ctaUrl: e.target.value }))}
                className="h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary col-span-2" />
            </div>
            <div className="flex gap-2">
              <button onClick={saveBanner} disabled={saving || !bannerForm.title}
                className="h-8 px-4 text-xs bg-primary text-white rounded-md hover:bg-primary-active transition-colors disabled:opacity-60">
                {saving ? "Saving…" : "Save Banner"}
              </button>
              <button onClick={() => setShowBannerForm(false)} className="h-8 px-4 text-xs border border-white/10 text-on-dark-soft rounded-md hover:text-on-dark transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {banners.length === 0 && !showBannerForm && <p className="text-sm text-on-dark-soft py-4 text-center">No banners yet.</p>}
          {banners.map(b => (
            <div key={b.id} className="bg-surface-dark-elevated border border-white/8 rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-on-dark font-medium">{b.title}</p>
                <p className="text-xs text-on-dark-soft mt-0.5">{b.subtitle} · CTA: &ldquo;{b.ctaLabel}&rdquo;</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${b.active ? "bg-success/12 text-success" : "bg-white/8 text-on-dark-soft"}`}>
                  {b.active ? "Live" : "Draft"}
                </span>
                <button onClick={() => toggleBanner(b.id, b.active)} title={b.active ? "Set to draft" : "Set to live"}
                  className="w-7 h-7 flex items-center justify-center rounded text-on-dark-soft hover:text-on-dark hover:bg-white/8 transition-colors">
                  {b.active ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
                <button onClick={() => deleteBanner(b.id)}
                  className="w-7 h-7 flex items-center justify-center rounded text-on-dark-soft hover:text-error hover:bg-error/10 transition-colors">
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
          <div className="flex items-center gap-2">
            <select
              value={addFeaturedId}
              onChange={e => setAddFeaturedId(e.target.value)}
              className="h-8 px-2 text-xs bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark focus:outline-none focus:border-primary"
            >
              <option value="">Select product…</option>
              {products
                .filter(p => !featured.some(f => f.product.id === p.id))
                .map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <button onClick={addFeatured} disabled={!addFeaturedId || saving}
              className="h-8 px-3 text-xs bg-primary text-white rounded-md flex items-center gap-1.5 hover:bg-primary-active transition-colors disabled:opacity-60">
              <Plus size={12} /> Add
            </button>
          </div>
        </div>
        <div className="bg-surface-dark-elevated border border-white/8 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {["Product", "Type", "Price", "Pinned", ""].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featured.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-on-dark-soft">No featured products yet.</td></tr>
              ) : featured.map((f, i) => (
                <tr key={f.id} className={`hover:bg-white/3 transition-colors ${i < featured.length - 1 ? "border-b border-white/8" : ""}`}>
                  <td className="px-5 py-3.5 text-on-dark font-medium">{f.product.title}</td>
                  <td className="px-5 py-3.5"><span className="text-xs px-2 py-0.5 rounded bg-white/5 text-on-dark-soft capitalize">{f.product.type}</span></td>
                  <td className="px-5 py-3.5 text-on-dark">₹{(f.product.price / 100).toFixed(0)}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => togglePinned(f.id, f.pinned)}
                      className={`w-8 h-4 rounded-full transition-colors ${f.pinned ? "bg-primary" : "bg-white/15"}`} />
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => removeFeatured(f.id)}
                      className="w-7 h-7 flex items-center justify-center rounded text-on-dark-soft hover:text-error hover:bg-error/10 transition-colors">
                      <X size={13} />
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
          <button onClick={() => setShowPopupForm(v => !v)} className="h-8 px-3 text-xs bg-primary text-white rounded-md flex items-center gap-1.5 hover:bg-primary-active transition-colors">
            <Plus size={12} /> Add Popup
          </button>
        </div>

        {showPopupForm && (
          <div className="bg-surface-dark-elevated border border-white/8 rounded-xl p-5 mb-3">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input placeholder="Title *" value={popupForm.title} onChange={e => setPopupForm(f => ({ ...f, title: e.target.value }))}
                className="h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary col-span-2" />
              <input placeholder="Coupon code (optional)" value={popupForm.code} onChange={e => setPopupForm(f => ({ ...f, code: e.target.value }))}
                className="h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary" />
              <select value={popupForm.trigger} onChange={e => setPopupForm(f => ({ ...f, trigger: e.target.value }))}
                className="h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark focus:outline-none focus:border-primary">
                <option value="page_load">On page load</option>
                <option value="exit_intent">Exit intent</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={savePopup} disabled={saving || !popupForm.title}
                className="h-8 px-4 text-xs bg-primary text-white rounded-md hover:bg-primary-active transition-colors disabled:opacity-60">
                {saving ? "Saving…" : "Save Popup"}
              </button>
              <button onClick={() => setShowPopupForm(false)} className="h-8 px-4 text-xs border border-white/10 text-on-dark-soft rounded-md hover:text-on-dark transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {popups.length === 0 && !showPopupForm && <p className="text-sm text-on-dark-soft py-4 text-center">No popups yet.</p>}
          {popups.map(p => (
            <div key={p.id} className="bg-surface-dark-elevated border border-white/8 rounded-xl px-5 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-on-dark font-medium">{p.title}</p>
                <p className="text-xs text-on-dark-soft mt-0.5">
                  {p.code && <span>Code: <span className="font-mono text-accent-amber">{p.code}</span> · </span>}
                  Trigger: {p.trigger === "page_load" ? "Page load" : "Exit intent"} · Delay: {p.delayMs / 1000}s
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => togglePopup(p.id, p.active)}
                  className={`text-xs font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer ${p.active ? "bg-success/12 text-success hover:bg-success/20" : "bg-white/8 text-on-dark-soft hover:bg-white/15"}`}>
                  {p.active ? "Active" : "Inactive"}
                </button>
                <button onClick={() => deletePopup(p.id)}
                  className="w-7 h-7 flex items-center justify-center rounded text-on-dark-soft hover:text-error hover:bg-error/10 transition-colors">
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
