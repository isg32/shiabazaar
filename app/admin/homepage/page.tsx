"use client";

import { useState, useEffect, useRef } from "react";
import { Trash2, Plus, Loader2, X, Upload, ImageIcon } from "lucide-react";
import Image from "next/image";

type Banner   = { id: string; position: number; title: string; subtitle: string | null; ctaLabel: string; ctaUrl: string; imageUrl: string | null; cloudinaryId: string | null; active: boolean };
type Popup    = { id: string; title: string; code: string | null; trigger: string; delayMs: number; active: boolean };
type Featured = { id: string; pinned: boolean; product: { id: string; title: string; type: string; price: number } };
type PopularBook = { id: string; product: { id: string; title: string; author: string | null; publisher: string | null; price: number } };
type ProductOption = { id: string; title: string; type: string };

const BLANK_POPUP = { title: "", code: "", trigger: "page_load", delayMs: 3000 };

const HERO_SLOTS = [
  { label: "Main Banner",  position: 0 },
  { label: "Sub-banner 1", position: 1 },
  { label: "Sub-banner 2", position: 2 },
  { label: "Sub-banner 3", position: 3 },
] as const;

export default function AdminHomepage() {
  const [banners,   setBanners]   = useState<Banner[]>([]);
  const [featured,  setFeatured]  = useState<Featured[]>([]);
  const [popular,   setPopular]   = useState<PopularBook[]>([]);
  const [popups,    setPopups]    = useState<Popup[]>([]);
  const [products,  setProducts]  = useState<ProductOption[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [addPopularId, setAddPopularId] = useState("");

  const [uploading,      setUploading]      = useState<Record<number, boolean>>({});
  const [savingSlot,     setSavingSlot]     = useState<number | null>(null);
  const [savedSlot,      setSavedSlot]      = useState<number | null>(null);
  const [showPopupForm,  setShowPopupForm]  = useState(false);
  const [popupForm,      setPopupForm]      = useState(BLANK_POPUP);
  const [addFeaturedId,  setAddFeaturedId]  = useState("");
  const [saving,         setSaving]         = useState(false);
  const fileRef0 = useRef<HTMLInputElement>(null);
  const fileRef1 = useRef<HTMLInputElement>(null);
  const fileRef2 = useRef<HTMLInputElement>(null);
  const fileRef3 = useRef<HTMLInputElement>(null);
  const fileRefs = [fileRef0, fileRef1, fileRef2, fileRef3];
  type SubForm = { title: string; subtitle: string; ctaLabel: string; ctaUrl: string };
  const [subForms, setSubForms] = useState<Record<number, SubForm>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/banners").then(r => r.json()),
      fetch("/api/admin/featured").then(r => r.json()),
      fetch("/api/admin/popular-books").then(r => r.json()),
      fetch("/api/admin/popups").then(r => r.json()),
      fetch("/api/admin/products").then(r => r.json()),
    ]).then(([b, f, pop, p, pr]) => {
      const loadedBanners: Banner[] = b.banners ?? [];
      setBanners(loadedBanners);
      setFeatured(f.featured ?? []);
      setPopular(pop.popular ?? []);
      setPopups(p.popups ?? []);
      setProducts((pr.products ?? []).map((p: { id: string; title: string; type: string }) => ({ id: p.id, title: p.title, type: p.type })));
      // pre-populate text forms from DB for all 4 slots
      const forms: Record<number, SubForm> = {};
      const defaultTitles: Record<number, string> = { 0: "Hero Left", 1: "Sub-banner 1", 2: "Sub-banner 2", 3: "Sub-banner 3" };
      [0, 1, 2, 3].forEach(pos => {
        const ban = loadedBanners[pos];
        if (ban) forms[pos] = { title: ban.title === defaultTitles[pos] ? "" : ban.title, subtitle: ban.subtitle ?? "", ctaLabel: ban.ctaLabel, ctaUrl: ban.ctaUrl };
        else forms[pos] = { title: "", subtitle: "", ctaLabel: pos === 0 ? "Explore Collection" : "Shop Now", ctaUrl: "/products" };
      });
      setSubForms(forms);
      setLoading(false);
    });
  }, []);

  const bannerAtSlot = (slotIndex: number) => banners.find(b => b.position === slotIndex) ?? null;

  async function uploadHeroImage(slotIndex: number, file: File) {
    setUploading(u => ({ ...u, [slotIndex]: true }));
    try {
      const signRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "shiabazaar/banners" }),
      });
      const sign = await signRes.json();
      const fd = new FormData();
      fd.append("file", file);
      fd.append("timestamp", sign.timestamp);
      fd.append("signature", sign.signature);
      fd.append("api_key", sign.apiKey);
      fd.append("folder", sign.folder);
      const up = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, { method: "POST", body: fd });
      const img = await up.json();

      const existing = bannerAtSlot(slotIndex);
      if (existing) {
        await fetch(`/api/admin/banners/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: img.secure_url, cloudinaryId: img.public_id }),
        });
        setBanners(prev => prev.map(b => b.position === slotIndex ? { ...b, imageUrl: img.secure_url, cloudinaryId: img.public_id } : b));
      } else {
        const res = await fetch("/api/admin/banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: slotIndex === 0 ? "Hero Left" : `Sub-banner ${slotIndex}`,
            imageUrl: img.secure_url,
            cloudinaryId: img.public_id,
            position: slotIndex,
          }),
        });
        const d = await res.json();
        setBanners(prev => [...prev, d.banner].sort((a, b) => a.position - b.position));
      }
    } finally {
      setUploading(u => ({ ...u, [slotIndex]: false }));
    }
  }

  async function removeHeroImage(slotIndex: number) {
    const existing = bannerAtSlot(slotIndex);
    if (!existing) return;
    await fetch(`/api/admin/banners/${existing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: null, cloudinaryId: null }),
    });
    setBanners(prev => prev.map(b => b.position === slotIndex ? { ...b, imageUrl: null, cloudinaryId: null } : b));
  }

  async function saveSlotText(slotIndex: number) {
    const form = subForms[slotIndex];
    if (!form) return;
    setSavingSlot(slotIndex);
    try {
      const { title, subtitle, ctaLabel, ctaUrl } = form;
      const defaultTitle = slotIndex === 0 ? "Hero Left" : `Sub-banner ${slotIndex}`;
      const existing = bannerAtSlot(slotIndex);
      const payload = { title: title || defaultTitle, subtitle: subtitle || null, ctaLabel: ctaLabel || "Shop Now", ctaUrl: ctaUrl || "/products" };
      if (existing) {
        const res = await fetch(`/api/admin/banners/${existing.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        setBanners(prev => prev.map(b => b.position === slotIndex ? { ...b, ...payload } : b));
      } else {
        const res = await fetch("/api/admin/banners", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, imageUrl: null, position: slotIndex }),
        });
        if (!res.ok) throw new Error(await res.text());
        const d = await res.json();
        setBanners(prev => [...prev, d.banner].sort((a, b) => a.position - b.position));
      }
      setSavedSlot(slotIndex);
      setTimeout(() => setSavedSlot(null), 2000);
    } catch (err) {
      alert(`Save failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setSavingSlot(null);
    }
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

  async function addPopularBook() {
    if (!addPopularId) return;
    setSaving(true);
    const res = await fetch("/api/admin/popular-books", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: addPopularId }) });
    const d = await res.json();
    if (d.item) setPopular(prev => [...prev.filter(p => p.product.id !== addPopularId), d.item]);
    setAddPopularId("");
    setSaving(false);
  }
  async function removePopularBook(id: string) {
    await fetch(`/api/admin/popular-books/${id}`, { method: "DELETE" });
    setPopular(prev => prev.filter(p => p.id !== id));
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

      {/* ── Hero Images ── */}
      <section className="mb-8">
        <div className="mb-4">
          <h2 className="text-base font-medium text-on-dark">Hero Images</h2>
          <p className="text-xs text-on-dark-soft mt-0.5">1 main banner + 3 clickable sub-banners below it.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HERO_SLOTS.map(({ label, position }) => {
            const banner = bannerAtSlot(position);
            const isUploading = uploading[position];
            const form = subForms[position] ?? { title: "", subtitle: "", ctaLabel: "", ctaUrl: "" };
            const setForm = (patch: Partial<SubForm>) => setSubForms(u => ({ ...u, [position]: { ...form, ...patch } }));
            return (
              <div key={position} className="bg-surface-dark-elevated border border-white/8 rounded-xl overflow-hidden">
                {/* Image preview */}
                <div className="relative bg-surface-dark w-full h-32 flex items-center justify-center">
                  {banner?.imageUrl ? (
                    <Image src={banner.imageUrl} alt={label} fill className="object-cover" sizes="400px" />
                  ) : (
                    <ImageIcon size={28} className="text-white/20" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 text-on-dark text-sm">
                      <Loader2 size={16} className="animate-spin" /> Uploading…
                    </div>
                  )}
                </div>
                {/* Controls */}
                <div className="px-4 py-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-on-dark">{label}</p>
                    <div className="flex items-center gap-2">
                      <input ref={fileRefs[position]} type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadHeroImage(position, f); e.target.value = ""; }} />
                      <button onClick={() => fileRefs[position].current?.click()} disabled={isUploading}
                        className="h-7 px-3 text-xs bg-primary text-white rounded flex items-center gap-1.5 hover:bg-primary-active transition-colors disabled:opacity-60">
                        <Upload size={11} /> {banner?.imageUrl ? "Replace" : "Upload"}
                      </button>
                      {banner?.imageUrl && (
                        <button onClick={() => removeHeroImage(position)} disabled={isUploading}
                          className="h-7 w-7 flex items-center justify-center rounded text-on-dark-soft hover:text-error hover:bg-error/10 transition-colors disabled:opacity-60">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Text fields */}
                  <input type="text" placeholder="Title" value={form.title}
                    onChange={e => setForm({ title: e.target.value })}
                    className="h-7 px-2.5 text-xs bg-surface-dark border border-white/10 rounded text-on-dark placeholder:text-on-dark-soft/50 focus:outline-none focus:border-primary" />
                  <input type="text" placeholder="Subtitle" value={form.subtitle}
                    onChange={e => setForm({ subtitle: e.target.value })}
                    className="h-7 px-2.5 text-xs bg-surface-dark border border-white/10 rounded text-on-dark placeholder:text-on-dark-soft/50 focus:outline-none focus:border-primary" />
                  <div className="flex gap-2">
                    <input type="text" placeholder='Button (e.g. "SHOP NOW")' value={form.ctaLabel}
                      onChange={e => setForm({ ctaLabel: e.target.value })}
                      className="flex-1 h-7 px-2.5 text-xs bg-surface-dark border border-white/10 rounded text-on-dark placeholder:text-on-dark-soft/50 focus:outline-none focus:border-primary" />
                    <input type="text" placeholder="Link URL" value={form.ctaUrl}
                      onChange={e => setForm({ ctaUrl: e.target.value })}
                      className="flex-1 h-7 px-2.5 text-xs bg-surface-dark border border-white/10 rounded text-on-dark placeholder:text-on-dark-soft/50 focus:outline-none focus:border-primary" />
                  </div>
                  <button onClick={() => saveSlotText(position)} disabled={savingSlot === position}
                    className="h-7 px-3 text-xs border border-white/10 text-on-dark-soft rounded hover:text-on-dark hover:border-white/20 transition-colors self-start disabled:opacity-60 flex items-center gap-1.5">
                    {savingSlot === position ? <><Loader2 size={11} className="animate-spin" /> Saving…</> : savedSlot === position ? "Saved ✓" : "Save Text"}
                  </button>
                </div>
              </div>
            );
          })}
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

      {/* ── Popular Books ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-medium text-on-dark">Popular Books</h2>
            <p className="text-xs text-on-dark-soft mt-0.5">Shown on the homepage above Featured Products.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={addPopularId}
              onChange={e => setAddPopularId(e.target.value)}
              className="h-8 px-2 text-xs bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark focus:outline-none focus:border-primary"
            >
              <option value="">Select a book…</option>
              {products
                .filter(p => p.type === "book" && !popular.some(pb => pb.product.id === p.id))
                .map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <button onClick={addPopularBook} disabled={!addPopularId || saving}
              className="h-8 px-3 text-xs bg-primary text-white rounded-md flex items-center gap-1.5 hover:bg-primary-active transition-colors disabled:opacity-60">
              <Plus size={12} /> Add
            </button>
          </div>
        </div>
        <div className="bg-surface-dark-elevated border border-white/8 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {["Title", "Author", "Publication", "Price", ""].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {popular.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-on-dark-soft">No popular books selected yet.</td></tr>
              ) : popular.map((pb, i) => (
                <tr key={pb.id} className={`hover:bg-white/3 transition-colors ${i < popular.length - 1 ? "border-b border-white/8" : ""}`}>
                  <td className="px-5 py-3.5 text-on-dark font-medium max-w-[200px] truncate">{pb.product.title}</td>
                  <td className="px-5 py-3.5 text-on-dark-soft text-xs">{pb.product.author ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    {pb.product.publisher ? (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${pb.product.publisher === "Tazeem Publication" ? "bg-primary/15 text-primary" : "bg-white/5 text-on-dark-soft"}`}>
                        {pb.product.publisher === "Tazeem Publication" ? "Tazeem" : "Other"}
                      </span>
                    ) : <span className="text-on-dark-soft/40 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-on-dark font-mono text-xs">₹{(pb.product.price / 100).toFixed(0)}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => removePopularBook(pb.id)}
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
