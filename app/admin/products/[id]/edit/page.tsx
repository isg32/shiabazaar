"use client";

import { useState, useRef, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, Loader2, X, Star } from "lucide-react";
import Image from "next/image";

type ProductType = "book" | "gift" | "ladies" | "gents" | "other";

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
type ExistingVariant = {
  id: string;
  label: string;
  stock: number;
  price: number | null;
};
type NewVariant = { label: string; stock: string; price: string };
type NavCategory = { id: string; name: string; slug: string; group: string };

function groupForType(type: ProductType) {
  return type;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function EditProductPage({
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
    type: "book" as ProductType,
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
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);

  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [newImages, setNewImages] = useState<NewImage[]>([]);
  const [existingVariants, setExistingVariants] = useState<ExistingVariant[]>(
    [],
  );
  const [newVariants, setNewVariants] = useState<NewVariant[]>([]);
  const [deletedImages, setDeletedImages] = useState<string[]>([]);
  const [deletedVariants, setDeletedVariants] = useState<string[]>([]);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setAllCategories(d.categories ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then((r) => r.json())
      .then(({ product }) => {
        if (!product) {
          setError("Product not found.");
          setLoading(false);
          return;
        }
        setForm({
          title: product.title ?? "",
          slug: product.slug ?? "",
          type: product.type ?? "book",
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
        setExistingVariants(
          product.variants?.map((v: ExistingVariant) => ({
            id: v.id,
            label: v.label,
            stock: v.stock,
            price: v.price,
          })) ?? [],
        );
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load product.");
        setLoading(false);
      });
  }, [id]);

  function set(k: string, v: string | boolean) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // ── Images ──────────────────────────────────────────────────────────────────

  function addFiles(files: FileList | null) {
    if (!files) return;
    const noCover =
      existingImages.every((i) => !i.isCover) &&
      newImages.every((i) => !i.isCover);
    const next: NewImage[] = Array.from(files).map((file, i) => ({
      file,
      url: URL.createObjectURL(file),
      isCover: noCover && i === 0,
    }));
    setNewImages((prev) => [...prev, ...next]);
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

  // ── Variants ─────────────────────────────────────────────────────────────────

  function removeExistingVariant(variantId: string) {
    setDeletedVariants((prev) => [...prev, variantId]);
    setExistingVariants((prev) => prev.filter((v) => v.id !== variantId));
  }

  function updateExistingVariant(
    variantId: string,
    k: "label" | "stock" | "price",
    v: string,
  ) {
    setExistingVariants((prev) =>
      prev.map((vv) =>
        vv.id === variantId
          ? {
              ...vv,
              [k]:
                k === "stock"
                  ? parseInt(v) || 0
                  : k === "price"
                    ? parseFloat(v) || null
                    : v,
            }
          : vv,
      ),
    );
  }

  function addNewVariant() {
    setNewVariants((v) => [...v, { label: "", stock: "0", price: "" }]);
  }
  function updateNewVariant(i: number, k: keyof NewVariant, v: string) {
    setNewVariants((prev) =>
      prev.map((vv, n) => (n === i ? { ...vv, [k]: v } : vv)),
    );
  }
  function removeNewVariant(i: number) {
    setNewVariants((prev) => prev.filter((_, n) => n !== i));
  }

  // ── Upload ───────────────────────────────────────────────────────────────────

  async function uploadToCloudinary(
    file: File,
  ): Promise<{ url: string; cloudinaryId: string }> {
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

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.slug || !form.price) {
      setError("Title, slug, and price are required.");
      return;
    }
    setError("");
    setSaving(true);

    try {
      // 1. Patch core fields
      await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          slug: form.slug,
          type: form.type,
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

      // 2. Delete removed images (also removes from Cloudinary)
      for (const imgId of deletedImages) {
        await fetch(`/api/admin/products/${id}/images`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageId: imgId }),
        });
      }

      // 3. Update cover flag on remaining existing images
      for (const img of existingImages) {
        await fetch(`/api/admin/products/${id}/images`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageId: img.id, isCover: img.isCover }),
        });
      }

      // 4. Upload new images
      for (const ni of newImages) {
        const { url, cloudinaryId } = await uploadToCloudinary(ni.file);
        await fetch(`/api/admin/products/${id}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, cloudinaryId, isCover: ni.isCover }),
        });
      }

      // 5. Delete removed variants
      for (const variantId of deletedVariants) {
        await fetch(`/api/admin/products/${id}/variants`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId }),
        });
      }

      // 6. Update existing variants
      for (const v of existingVariants) {
        await fetch(`/api/admin/products/${id}/variants`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variantId: v.id,
            label: v.label,
            stock: v.stock,
            price: v.price,
          }),
        });
      }

      // 7. Add new variants
      for (const v of newVariants) {
        if (!v.label.trim()) continue;
        await fetch(`/api/admin/products/${id}/variants`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: v.label,
            stock: parseInt(v.stock) || 0,
            price: v.price ? parseFloat(v.price) : null,
          }),
        });
      }

      router.push("/admin/products");
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  const isBook = form.type === "book";
  const filteredCategories = allCategories.filter(
    (c) => c.group === groupForType(form.type),
  );

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
          group: groupForType(form.type),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-2 text-on-dark-soft">
        <Loader2 size={16} className="animate-spin" /> Loading product…
      </div>
    );
  }

  return (
    <div className="px-8 py-8 text-on-dark max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-on-dark">Edit Product</h1>
        <p className="text-sm text-on-dark-soft mt-0.5 font-mono">{id}</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic info */}
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
              <label className={labelCls}>Type *</label>
              <select
                className={inputCls}
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
              >
                <option value="book">Book</option>
                <option value="gift">Gift</option>
                <option value="other">Other Products</option>
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
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${form.inStock ? "translate-x-4" : "-translate-x-0.5"}`}
                />
              </button>
              <label className="text-sm text-on-dark">In Stock</label>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Category</label>
              <div className="flex gap-2">
                <select
                  className={inputCls}
                  value={form.categoryId}
                  onChange={(e) => set("categoryId", e.target.value)}
                >
                  <option value="">— No category —</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  className={`${inputCls} flex-1`}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Or type to create new category…"
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
            <div className="sm:col-span-2">
              <label className={labelCls}>Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary resize-none"
                placeholder="Brief description of the product…"
              />
            </div>
          </div>
        </div>

        {/* Book metadata */}
        {isBook && (
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
                <label className={labelCls}>ISBN</label>
                <input
                  className={inputCls}
                  value={form.isbn}
                  onChange={(e) => set("isbn", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Language</label>
                <input
                  className={inputCls}
                  value={form.language}
                  onChange={(e) => set("language", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Genre</label>
                <input
                  className={inputCls}
                  value={form.genre}
                  onChange={(e) => set("genre", e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls}>Edition</label>
                <input
                  className={inputCls}
                  value={form.edition}
                  onChange={(e) => set("edition", e.target.value)}
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
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Table of Contents</label>
                <textarea
                  rows={3}
                  value={form.tableOfContents}
                  onChange={(e) => set("tableOfContents", e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Images */}
        <div className={sectionCls}>
          <h2 className="text-sm font-medium text-on-dark mb-5">Images</h2>
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
              {newImages.map((p, i) => (
                <div
                  key={`new-${i}`}
                  className="relative group aspect-[3/4] rounded-lg overflow-hidden bg-surface-dark-soft border border-primary/40"
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
                      onClick={() => setNewCover(i)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${p.isCover ? "bg-accent-amber" : "bg-white/20 hover:bg-accent-amber"}`}
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
                  {p.isCover && (
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-medium bg-accent-amber text-white px-1.5 py-0.5 rounded uppercase tracking-wide">
                      Cover
                    </span>
                  )}
                  <span className="absolute top-1.5 right-1.5 text-[9px] font-medium bg-primary text-white px-1.5 py-0.5 rounded uppercase tracking-wide">
                    New
                  </span>
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
          <p className="text-xs text-on-dark-soft mt-2">
            Click ★ to set cover. New images shown with blue border.
          </p>
        </div>

        {/* Variants (non-book) */}
        {!isBook && (
          <div className={sectionCls}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-medium text-on-dark">Variants</h2>
              <button
                type="button"
                onClick={addNewVariant}
                className="h-8 px-3 text-xs font-medium bg-white/8 hover:bg-white/12 text-on-dark rounded-md flex items-center gap-1.5 transition-colors"
              >
                <Plus size={12} /> Add Variant
              </button>
            </div>

            {existingVariants.length === 0 && newVariants.length === 0 ? (
              <p className="text-sm text-on-dark-soft">
                No variants — single product with base price and stock.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Existing */}
                {existingVariants.map((v, i) => (
                  <div
                    key={v.id}
                    className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end"
                  >
                    <div>
                      {i === 0 && <label className={labelCls}>Label</label>}
                      <input
                        className={inputCls}
                        value={v.label}
                        onChange={(e) =>
                          updateExistingVariant(v.id, "label", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      {i === 0 && <label className={labelCls}>Stock</label>}
                      <input
                        className={inputCls}
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) =>
                          updateExistingVariant(v.id, "stock", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      {i === 0 && (
                        <label className={labelCls}>Price (₹, optional)</label>
                      )}
                      <input
                        className={inputCls}
                        type="number"
                        min="0"
                        step="0.01"
                        value={v.price !== null ? String(v.price / 100) : ""}
                        onChange={(e) =>
                          updateExistingVariant(v.id, "price", e.target.value)
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExistingVariant(v.id)}
                      className={`${i === 0 ? "mt-5" : ""} h-9 w-9 flex items-center justify-center text-on-dark-soft hover:text-error transition-colors`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {/* New */}
                {newVariants.map((v, i) => {
                  const offset = existingVariants.length + i;
                  return (
                    <div
                      key={`new-${i}`}
                      className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end"
                    >
                      <div>
                        {offset === 0 && (
                          <label className={labelCls}>Label</label>
                        )}
                        <input
                          className={inputCls}
                          value={v.label}
                          onChange={(e) =>
                            updateNewVariant(i, "label", e.target.value)
                          }
                          placeholder="Small"
                        />
                      </div>
                      <div>
                        {offset === 0 && (
                          <label className={labelCls}>Stock</label>
                        )}
                        <input
                          className={inputCls}
                          type="number"
                          min="0"
                          value={v.stock}
                          onChange={(e) =>
                            updateNewVariant(i, "stock", e.target.value)
                          }
                        />
                      </div>
                      <div>
                        {offset === 0 && (
                          <label className={labelCls}>
                            Price (₹, optional)
                          </label>
                        )}
                        <input
                          className={inputCls}
                          type="number"
                          min="0"
                          step="0.01"
                          value={v.price}
                          onChange={(e) =>
                            updateNewVariant(i, "price", e.target.value)
                          }
                          placeholder="—"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNewVariant(i)}
                        className={`${offset === 0 ? "mt-5" : ""} h-9 w-9 flex items-center justify-center text-on-dark-soft hover:text-error transition-colors`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {error && <p className="text-sm text-error mb-4">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-6 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-active transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="h-10 px-6 text-sm font-medium text-on-dark-soft hover:text-on-dark transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
