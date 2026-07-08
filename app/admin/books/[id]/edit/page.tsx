"use client";

import { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, X, Star, Trash2 } from "lucide-react";
import Image from "next/image";

const inputCls =
  "w-full h-9 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary";
const labelCls =
  "text-xs text-on-dark-soft uppercase tracking-wide block mb-1.5";
const sectionCls =
  "bg-surface-dark-elevated rounded-xl border border-white/8 p-6 mb-5";

type ExistingImage = {
  id: string;
  url: string;
  isCover: boolean;
  cloudinaryId: string;
};
type NewImage = { file: File; url: string; isCover: boolean };
type NavCategory = { id: string; name: string; slug: string; group: string };

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
  const [allCategories, setAllCategories] = useState<NavCategory[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);
  const [popular, setPopular] = useState(false);
  const [popularRecordId, setPopularRecordId] = useState<string | null>(null);
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

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then((r) => r.json())
      .then(({ product }) => {
        if (!product) {
          setError("Book not found.");
          setLoading(false);
          return;
        }
        setForm({
          title: product.title ?? "",
          slug: product.slug ?? "",
          price: product.price ? String(product.price / 100) : "",
          originalPrice: product.originalPrice
            ? String(product.originalPrice / 100)
            : "",
          inStock: product.inStock ?? true,
          badge: product.badge ?? "",
          author: product.author ?? "",
          isbn: product.isbn ?? "",
          publisher: product.publisher ?? "",
          language: product.language ?? "",
          genre: product.genre ?? "",
          pageCount: product.pageCount ? String(product.pageCount) : "",
          edition: product.edition ?? "",
          description: product.description ?? "",
          tableOfContents: product.tableOfContents ?? "",
          categoryId: product.categoryId ?? "",
        });
        setExistingImages(product.images ?? []);
        // Check popular status in parallel
        fetch("/api/admin/popular-books")
          .then((r) => r.json())
          .then(({ popular: list }) => {
            const entry = (list ?? []).find(
              (p: { product: { id: string }; id: string }) => p.product.id === id,
            );
            if (entry) { setPopular(true); setPopularRecordId(entry.id); }
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      })
      .catch(() => {
        setError("Failed to load book.");
        setLoading(false);
      });
  }, [id]);

  function set(k: string, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function togglePopular() {
    if (popular && popularRecordId) {
      await fetch(`/api/admin/popular-books/${popularRecordId}`, { method: "DELETE" });
      setPopular(false);
      setPopularRecordId(null);
    } else {
      const res = await fetch("/api/admin/popular-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      }).then((r) => r.json());
      setPopular(true);
      setPopularRecordId(res.item?.id ?? null);
    }
  }

  function addFiles(files: FileList | null) {
    if (!files) return;
    const noCover =
      existingImages.every((i) => !i.isCover) &&
      newImages.every((i) => !i.isCover);
    setNewImages((prev) => [
      ...prev,
      ...Array.from(files).map((file, i) => ({
        file,
        url: URL.createObjectURL(file),
        isCover: noCover && i === 0,
      })),
    ]);
  }

  function setExistingCover(imgId: string) {
    setExistingImages((prev) =>
      prev.map((i) => ({ ...i, isCover: i.id === imgId })),
    );
    setNewImages((prev) => prev.map((i) => ({ ...i, isCover: false })));
  }

  function setNewCover(idx: number) {
    setExistingImages((prev) => prev.map((i) => ({ ...i, isCover: false })));
    setNewImages((prev) => prev.map((i, n) => ({ ...i, isCover: n === idx })));
  }

  function removeExistingImage(imgId: string) {
    setDeletedImages((prev) => [...prev, imgId]);
    const removed = existingImages.find((i) => i.id === imgId);
    setExistingImages((prev) => {
      const next = prev.filter((i) => i.id !== imgId);
      if (removed?.isCover && next.length > 0) next[0].isCover = true;
      return next;
    });
  }

  function removeNewImage(idx: number) {
    setNewImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (prev[idx].isCover && next.length > 0) next[0].isCover = true;
      return next;
    });
  }

  async function uploadToCloudinary(file: File) {
    const sign = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: `shiabazaar/products/${form.slug}` }),
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
      await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
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
      for (const imgId of deletedImages) {
        await fetch(`/api/admin/products/${id}/images`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageId: imgId }),
        });
      }
      for (const img of existingImages) {
        await fetch(`/api/admin/products/${id}/images`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageId: img.id, isCover: img.isCover }),
        });
      }
      for (const ni of newImages) {
        const { url, cloudinaryId } = await uploadToCloudinary(ni.file);
        await fetch(`/api/admin/products/${id}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, cloudinaryId, isCover: ni.isCover }),
        });
      }
      router.push("/admin/books");
    } catch {
      setError("Something went wrong.");
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="flex items-center justify-center py-32 gap-2 text-on-dark-soft">
        <Loader2 size={16} className="animate-spin" /> Loading book…
      </div>
    );

  return (
    <div className="px-8 py-8 text-on-dark max-w-3xl">
      <div className="mb-6">
        <h1
          className="text-2xl font-normal text-on-dark"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Edit Book
        </h1>
        <p className="text-sm text-on-dark-soft mt-0.5 font-mono">{id}</p>
      </div>

      <form onSubmit={handleSubmit}>
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
                required
              />
            </div>
            <div>
              <label className={labelCls}>Slug *</label>
              <input
                className={inputCls}
                value={form.slug}
                onChange={(e) => set("slug", slugify(e.target.value))}
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
            <div className="flex items-center gap-3 pt-5">
              <button
                type="button"
                onClick={togglePopular}
                className={`relative w-9 h-5 rounded-full transition-colors ${popular ? "bg-accent-amber" : "bg-on-dark-soft/30"}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${popular ? "translate-x-4" : "translate-x-0.5"}`}
                />
              </button>
              <label className="text-sm text-on-dark">Popular Book</label>
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
          {(existingImages.length > 0 || newImages.length > 0) && (
            <div className="grid grid-cols-4 gap-3 mb-4">
              {existingImages.map((img) => (
                <div
                  key={img.id}
                  className="relative group aspect-[3/4] rounded-lg overflow-hidden bg-surface-dark-soft border border-white/10"
                >
                  <Image
                    src={img.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExistingCover(img.id)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${img.isCover ? "bg-accent-amber" : "bg-white/20 hover:bg-accent-amber"}`}
                    >
                      <Star size={12} className="text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img.id)}
                      className="w-7 h-7 rounded-full bg-error/80 hover:bg-error flex items-center justify-center"
                    >
                      <Trash2 size={12} className="text-white" />
                    </button>
                  </div>
                  {img.isCover && (
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-medium bg-accent-amber text-white px-1.5 py-0.5 rounded uppercase tracking-wide">
                      Cover
                    </span>
                  )}
                </div>
              ))}
              {newImages.map((img, i) => (
                <div
                  key={`new-${i}`}
                  className="relative group aspect-[3/4] rounded-lg overflow-hidden bg-surface-dark-soft border border-white/10"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNewCover(i)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${img.isCover ? "bg-accent-amber" : "bg-white/20 hover:bg-accent-amber"}`}
                    >
                      <Star size={12} className="text-white" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="w-7 h-7 rounded-full bg-error/80 hover:bg-error flex items-center justify-center"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  </div>
                  {img.isCover && (
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
            {saving ? "Saving…" : "Save Book"}
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
