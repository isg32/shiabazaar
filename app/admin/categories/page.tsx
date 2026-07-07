"use client";

import { useState, useEffect } from "react";
import { Trash2, Loader2, Plus, GripVertical } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  group: string;
  active: boolean;
  position: number;
}

const GROUPS = [
  { key: "book",  label: "Books" },
  { key: "gift",  label: "Gifts" },
  { key: "other", label: "Other Products" },
];

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function CategoryRow({ cat, onUpdate, onDelete }: {
  cat: Category;
  onUpdate: (id: string, data: Partial<Category>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState(cat.name);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === cat.name) return;
    setSaving(true);
    await onUpdate(cat.id, { name: trimmed });
    setSaving(false);
  }

  async function toggleActive() {
    setSaving(true);
    await onUpdate(cat.id, { active: !cat.active });
    setSaving(false);
  }

  async function remove() {
    if (!confirm(`Delete "${cat.name}"? Products in this category will be uncategorized.`)) return;
    setDeleting(true);
    await onDelete(cat.id);
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/6 hover:bg-surface-dark-elevated transition-colors">
      <GripVertical size={14} className="text-on-dark-soft/40 shrink-0 cursor-grab" />
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        onBlur={save}
        onKeyDown={e => e.key === "Enter" && save()}
        className="flex-1 min-w-0 bg-transparent text-sm text-on-dark border-b border-transparent focus:border-primary/60 outline-none py-0.5 transition-colors"
      />
      <span className="text-xs text-on-dark-soft/50 font-mono shrink-0 hidden sm:block">{cat.slug}</span>
      <button
        onClick={toggleActive}
        disabled={saving}
        className={`shrink-0 w-9 h-5 rounded-full relative transition-colors disabled:opacity-50 ${cat.active ? "bg-primary" : "bg-on-dark-soft/30"}`}
        aria-label={cat.active ? "Deactivate" : "Activate"}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${cat.active ? "translate-x-0.4" : "-translate-x-4"}`} />
      </button>
      <button
        onClick={remove}
        disabled={deleting}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-on-dark-soft/50 hover:text-error hover:bg-error/10 transition-colors disabled:opacity-40"
        aria-label="Delete"
      >
        {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
      </button>
    </div>
  );
}

function AddCategoryRow({ group, onAdd }: { group: string; onAdd: (cat: Category) => void }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const slug = slugify(trimmed);
    setSaving(true);
    setErr("");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, slug, group }),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error ?? "Failed"); setSaving(false); return; }
    onAdd(data.category);
    setName("");
    setSaving(false);
  }

  return (
    <div className="px-4 py-3">
      {err && <p className="text-xs text-error mb-2">{err}</p>}
      <div className="flex gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
          placeholder="New category name…"
          className="flex-1 min-w-0 h-8 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft/40 focus:border-primary/60 outline-none transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !name.trim()}
          className="h-8 px-3 flex items-center gap-1.5 text-sm font-medium bg-primary text-on-primary rounded-md hover:bg-primary-active transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          Add
        </button>
      </div>
      {name.trim() && (
        <p className="text-[11px] text-on-dark-soft/50 mt-1.5 ml-1">slug: {slugify(name.trim())}</p>
      )}
    </div>
  );
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then(r => r.json())
      .then(d => { setCategories(d.categories ?? []); setLoading(false); });
  }, []);

  async function handleUpdate(id: string, data: Partial<Category>) {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const { category } = await res.json();
      setCategories(prev => prev.map(c => c.id === id ? { ...c, ...category } : c));
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) setCategories(prev => prev.filter(c => c.id !== id));
  }

  function handleAdd(cat: Category) {
    setCategories(prev => [...prev, cat]);
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-normal text-on-dark" style={{ fontFamily: "var(--font-display)" }}>Categories</h1>
        <p className="text-sm text-on-dark-soft mt-1">
          Manage the dropdown categories shown in the navbar under Books, Gifts, and Other Products.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-on-dark-soft text-sm">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {GROUPS.map(({ key, label }) => {
            const groupCats = categories.filter(c => c.group === key).sort((a, b) => a.position - b.position);
            return (
              <div key={key} className="bg-surface-dark rounded-xl border border-white/8 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                  <h2 className="text-sm font-medium text-on-dark">{label}</h2>
                  <span className="text-xs text-on-dark-soft">{groupCats.length} {groupCats.length === 1 ? "category" : "categories"}</span>
                </div>
                {groupCats.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-on-dark-soft/50">No categories yet.</p>
                ) : (
                  groupCats.map(cat => (
                    <CategoryRow key={cat.id} cat={cat} onUpdate={handleUpdate} onDelete={handleDelete} />
                  ))
                )}
                <AddCategoryRow group={key} onAdd={handleAdd} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
