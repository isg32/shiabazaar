"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, X, Star } from "lucide-react";

const inputCls =
  "w-full h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary";
const labelCls =
  "text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5";
const sectionCls =
  "bg-surface-dark-elevated rounded-xl border border-white/8 p-6 mb-5";

type ImgPreview = { file: File; url: string; isCover: boolean };
type NavCategory = { id: string; name: string; slug: string; group: string };

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function NewBookPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    slug: "",
    price: "",
    originalPrice: "",
    inStock: true,
    badge: "",
    author: "",
    isbn: "",
    publisher: "",
    language: "",
    genre: "",
    pageCount: "",
    edition: "",
    description: "",
    tableOfContents: "",
    categoryId: "",
  });
  const [previews, setPreviews] = useState<ImgPreview[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [allCategories, setAllCategories] = useState<NavCategory[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) =>
        setAllCategories(
          (d.categories ?? []).filter((c: NavCategory) => c.group === "book"),
        ),
      )
      .catch(() => {});
  }, []);

  function set(k: string, v: string | boolean) {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "title" && !f.slug) next.slug = slugify(v as string);
      return next;
    });
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const next: ImgPreview[] = Array.from(files).map((file, i) => ({
      file,
      url: URL.createObjectURL(file),
      isCover: previews.length === 0 && i === 0,
    }));
    setPreviews((prev) => [...prev, ...next]);
  }

  function setCover(idx: number) {
    setPreviews((prev) => prev.map((p, i) => ({ ...p, isCover: i === idx })));
  }

  function removePreview(idx: number) {
    setPreviews((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (prev[idx].isCover && next.length > 0) next[0].isCover = true;
      return next;
    });
  }

  async function uploadToCloudinary(file: File, slug: string) {
    const sign = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: `shiabazaar/products/${slug}` }),
    }).then((r) => r.json());
    const fd = new FormData();
    fd.append("file", file);
    fd.append("timestamp", sign.timestamp);
    fd.append("signature", sign.signature);
    fd.append("api_key", sign.apiKey);
    fd.append("folder", sign.folder);
    const data = await fetch(
      `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`,
      { method: "POST", body: fd },
    ).then((r) => r.json());
    return { url: data.secure_url, cloudinaryId: data.public_id };
  }

  async function createCategory() {
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          slug: slugify(newCatName),
          group: "book",
        }),
      });
      const { category } = await res.json();
      if (category) {
        setAllCategories((prev) => [...prev, category]);
        set("categoryId", category.id);
        setNewCatName("");
      }
    } finally {
      setCreatingCat(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.slug || !form.price) {
      setError("Title, slug, and price are required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          type: "book",
          price: parseFloat(form.price),
          originalPrice: form.originalPrice
            ? parseFloat(form.originalPrice)
            : null,
          inStock: form.inStock,
          badge: form.badge || null,
          author: form.author || null,
          isbn: form.isbn || null,
          publisher: form.publisher || null,
          language: form.language || null,
          genre: form.genre || null,
          pageCount: form.pageCount ? parseInt(form.pageCount) : null,
          edition: form.edition || null,
          description: form.description || null,
          tableOfContents: form.tableOfContents || null,
          categoryId: form.categoryId || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed.");
        setSaving(false);
        return;
      }
      const { product } = await res.json();
      for (const p of previews) {
        const { url, cloudinaryId } = await uploadToCloudinary(
          p.file,
          product.slug,
        );
        await fetch(`/api/admin/products/${product.id}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, cloudinaryId, isCover: p.isCover }),
        });
      }
      router.push("/admin/books");
    } catch {
      setError("Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <div className="px-8 py-8 text-on-dark max-w-3xl">
      <div className="mb-6">
        <h1
          className="text-2xl font-normal text-on-dark"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Add Book
        </h1>
        <p className="text-sm text-on-dark-soft mt-0.5">
          New book will appear on the storefront immediately.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Core */}
        <div className={sectionCls}>
          <h2 className="text-sm font-medium text-on-dark mb-5">
            Basic Information
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Title *</label>
              <input
                className={inputCls}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Nahjul Balagha"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Slug *</label>
              <input
                className={inputCls}
                value={form.slug}
                onChange={(e) => set("slug", slugify(e.target.value))}
                placeholder="nahjul-balagha"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select
                className={inputCls}
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
              >
                <option value="">— No category —</option>
                {allCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Price (₹) *</label>
              <input
                className={inputCls}
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                placeholder="699"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Original Price (₹)</label>
              <input
                className={inputCls}
                type="number"
                min="0"
                step="0.01"
                value={form.originalPrice}
                onChange={(e) => set("originalPrice", e.target.value)}
                placeholder="899"
              />
            </div>
            <div>
              <label className={labelCls}>Badge</label>
              <select
                className={inputCls}
                value={form.badge}
                onChange={(e) => set("badge", e.target.value)}
              >
                <option value="">None</option>
                <option>NEW</option>
                <option>BESTSELLER</option>
                <option>FEATURED</option>
                <option>ON SALE</option>
              </select>
            </div>
            <div className="flex items-center gap-3 pt-5">
              <button
                type="button"
                onClick={() => set("inStock", !form.inStock)}
                className={`relative w-9 h-5 rounded-full transition-colors ${form.inStock ? "bg-primary" : "bg-on-dark-soft/30"}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.inStock ? "translate-x-0.4" : "-translate-x-4"}`}
                />
              </button>
              <label className="text-sm text-on-dark">In Stock</label>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Or create new category</label>
              <div className="flex gap-2">
                <input
                  className={`${inputCls} flex-1`}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="New category name…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createCategory();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={createCategory}
                  disabled={creatingCat || !newCatName.trim()}
                  className="h-9 px-3 text-xs font-medium bg-white/8 hover:bg-white/12 text-on-dark rounded-md disabled:opacity-40 transition-colors whitespace-nowrap"
                >
                  {creatingCat ? "Adding…" : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Book details */}
        <div className={sectionCls}>
          <h2 className="text-sm font-medium text-on-dark mb-5">
            Book Details
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Author</label>
              <input
                className={inputCls}
                value={form.author}
                onChange={(e) => set("author", e.target.value)}
                placeholder="Imam Ali (AS)"
              />
            </div>
            <div>
              <label className={labelCls}>Publication</label>
              <select
                className={inputCls}
                value={form.publisher}
                onChange={(e) => set("publisher", e.target.value)}
              >
                <option value="">— Select —</option>
                <option value="Tazeem Publication">Tazeem Publication</option>
                <option value="Other Publications">Other Publications</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Language</label>
              <input
                className={inputCls}
                value={form.language}
                onChange={(e) => set("language", e.target.value)}
                placeholder="English"
              />
            </div>
            <div>
              <label className={labelCls}>Genre</label>
              <input
                className={inputCls}
                value={form.genre}
                onChange={(e) => set("genre", e.target.value)}
                placeholder="Fiqh"
              />
            </div>
            <div>
              <label className={labelCls}>ISBN</label>
              <input
                className={inputCls}
                value={form.isbn}
                onChange={(e) => set("isbn", e.target.value)}
                placeholder="978-…"
              />
            </div>
            <div>
              <label className={labelCls}>Edition</label>
              <input
                className={inputCls}
                value={form.edition}
                onChange={(e) => set("edition", e.target.value)}
                placeholder="2nd"
              />
            </div>
            <div>
              <label className={labelCls}>Page Count</label>
              <input
                className={inputCls}
                type="number"
                min="1"
                value={form.pageCount}
                onChange={(e) => set("pageCount", e.target.value)}
                placeholder="450"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary resize-none"
                placeholder="Brief description…"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Table of Contents</label>
              <textarea
                rows={3}
                value={form.tableOfContents}
                onChange={(e) => set("tableOfContents", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary resize-none"
                placeholder="Chapter 1: …"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className={sectionCls}>
          <h2 className="text-sm font-medium text-on-dark mb-5">
            Cover & Images
          </h2>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mb-4">
              {previews.map((p, i) => (
                <div
                  key={i}
                  className="relative group aspect-[3/4] rounded-lg overflow-hidden bg-surface-dark-soft border border-white/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCover(i)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${p.isCover ? "bg-accent-amber" : "bg-white/20 hover:bg-accent-amber"}`}
                    >
                      <Star size={12} className="text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removePreview(i)}
                      className="w-7 h-7 rounded-full bg-error/80 hover:bg-error flex items-center justify-center"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                  {p.isCover && (
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-medium bg-accent-amber text-white px-1.5 py-0.5 rounded uppercase tracking-wide">
                      Cover
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="h-9 px-4 border border-dashed border-white/20 text-on-dark-soft text-sm rounded-md hover:border-white/40 hover:text-on-dark transition-colors flex items-center gap-2"
          >
            <Upload size={14} /> Add Images
          </button>
        </div>

        {error && <p className="text-sm text-error mb-4">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-6 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-active transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Saving…" : "Add Book"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/books")}
            className="h-10 px-6 text-sm font-medium text-on-dark-soft hover:text-on-dark transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
