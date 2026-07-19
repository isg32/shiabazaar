"use client";

import { useState, useEffect } from "react";
import { Trash2, Loader2, Plus, ChevronRight } from "lucide-react";
import { buildCategoryTree, getDescendantIds, countDescendants, type CategoryNode } from "@/lib/category-tree";

interface Category {
  id: string;
  name: string;
  slug: string;
  group: string;
  parentId: string | null;
  active: boolean;
  position: number;
  _count?: { products: number };
}

const GROUPS = [
  { key: "book", label: "Books" },
  { key: "gift", label: "Gifts" },
  { key: "other", label: "Other Products" },
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function subtreeProductCount(categories: Category[], rootId: string): number {
  const ids = new Set(getDescendantIds(categories, rootId));
  return categories
    .filter((c) => ids.has(c.id))
    .reduce((sum, c) => sum + (c._count?.products ?? 0), 0);
}

function CategoryNodeRow({
  node,
  depth,
  allCategories,
  onUpdate,
  onDelete,
  onAddChild,
}: {
  node: CategoryNode & { active?: boolean; _count?: { products: number } };
  depth: number;
  allCategories: Category[];
  onUpdate: (id: string, data: Partial<Category>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddChild: (parentId: string, name: string) => Promise<void>;
}) {
  const [name, setName] = useState(node.name);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [addingChild, setAddingChild] = useState(false);
  const [childName, setChildName] = useState("");
  const [addingSaving, setAddingSaving] = useState(false);
  const children = node.children as (CategoryNode & { active?: boolean; _count?: { products: number } })[];

  async function save() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === node.name) return;
    setSaving(true);
    await onUpdate(node.id, { name: trimmed });
    setSaving(false);
  }

  async function toggleActive() {
    setSaving(true);
    await onUpdate(node.id, { active: !node.active });
    setSaving(false);
  }

  async function remove() {
    const descCount = countDescendants(allCategories, node.id);
    const productCount = subtreeProductCount(allCategories, node.id);
    const parts: string[] = [];
    if (descCount > 0) parts.push(`${descCount} subcategor${descCount === 1 ? "y" : "ies"}`);
    if (productCount > 0) parts.push(`${productCount} product${productCount === 1 ? "" : "s"} will be uncategorized`);
    const detail = parts.length ? ` This will also delete ${parts.join(" and ")}.` : "";
    if (!confirm(`Delete "${node.name}"?${detail}`)) return;
    setDeleting(true);
    await onDelete(node.id);
  }

  async function submitChild() {
    const trimmed = childName.trim();
    if (!trimmed) return;
    setAddingSaving(true);
    await onAddChild(node.id, trimmed);
    setChildName("");
    setAddingChild(false);
    setAddingSaving(false);
  }

  return (
    <>
      <div
        className="flex items-center gap-2 px-4 py-3 border-b border-white/6 hover:bg-surface-dark-elevated transition-colors"
        style={{ paddingLeft: 16 + depth * 20 }}
      >
        {children.length > 0 ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 text-on-dark-soft/60 hover:text-on-dark"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <ChevronRight size={13} className={`transition-transform ${expanded ? "rotate-90" : ""}`} />
          </button>
        ) : (
          <span className="w-[13px] shrink-0" />
        )}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => e.key === "Enter" && save()}
          className="flex-1 min-w-0 bg-transparent text-sm text-on-dark border-b border-transparent focus:border-primary/60 outline-none py-0.5 transition-colors"
        />
        <span className="text-xs text-on-dark-soft/50 font-mono shrink-0 hidden sm:block">
          {node.slug}
        </span>
        <button
          type="button"
          onClick={() => setAddingChild((v) => !v)}
          title="Add subcategory"
          className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition-colors ${addingChild ? "text-primary bg-primary/10" : "text-on-dark-soft/50 hover:text-primary hover:bg-primary/10"}`}
        >
          <Plus size={13} />
        </button>
        <button
          onClick={toggleActive}
          disabled={saving}
          className={`shrink-0 w-9 h-5 rounded-full relative transition-colors disabled:opacity-50 ${node.active ? "bg-primary" : "bg-on-dark-soft/30"}`}
          aria-label={node.active ? "Deactivate" : "Activate"}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${node.active ? "translate-x-0.4" : "-translate-x-4"}`}
          />
        </button>
        <button
          onClick={remove}
          disabled={deleting}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-on-dark-soft/50 hover:text-error hover:bg-error/10 transition-colors disabled:opacity-40"
          aria-label="Delete"
        >
          {deleting ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Trash2 size={13} />
          )}
        </button>
      </div>

      {addingChild && (
        <div
          style={{ paddingLeft: 16 + (depth + 1) * 20 }}
          className="px-4 py-2 border-b border-white/6"
        >
          <div className="flex gap-2">
            <input
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitChild()}
              placeholder="Subcategory name…"
              autoFocus
              className="flex-1 min-w-0 h-8 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft/40 focus:border-primary/60 outline-none transition-colors"
            />
            <button
              type="button"
              onClick={submitChild}
              disabled={addingSaving || !childName.trim()}
              className="h-8 px-3 flex items-center gap-1.5 text-sm font-medium bg-primary text-on-primary rounded-md hover:bg-primary-active transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              {addingSaving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Plus size={13} />
              )}
              Add
            </button>
          </div>
        </div>
      )}

      {expanded &&
        children.map((child) => (
          <CategoryNodeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            allCategories={allCategories}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onAddChild={onAddChild}
          />
        ))}
    </>
  );
}

function AddCategoryRow({
  group,
  onAdd,
}: {
  group: string;
  onAdd: (cat: Category) => void;
}) {
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
      body: JSON.stringify({ name: trimmed, slug, group, parentId: null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErr(data.error ?? "Failed");
      setSaving(false);
      return;
    }
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
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="New top-level category name…"
          className="flex-1 min-w-0 h-8 px-3 text-sm bg-surface-dark border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft/40 focus:border-primary/60 outline-none transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !name.trim()}
          className="h-8 px-3 flex items-center gap-1.5 text-sm font-medium bg-primary text-on-primary rounded-md hover:bg-primary-active transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {saving ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Plus size={13} />
          )}
          Add
        </button>
      </div>
      {name.trim() && (
        <p className="text-[11px] text-on-dark-soft/50 mt-1.5 ml-1">
          slug: {slugify(name.trim())}
        </p>
      )}
    </div>
  );
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.categories ?? []);
        setLoading(false);
      });
  }, []);

  async function handleUpdate(id: string, data: Partial<Category>) {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const { category } = await res.json();
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...category } : c)),
      );
    }
  }

  async function handleDelete(id: string) {
    const removedIds = new Set(getDescendantIds(categories, id));
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "DELETE",
    });
    if (res.ok) setCategories((prev) => prev.filter((c) => !removedIds.has(c.id)));
  }

  async function handleAddChild(parentId: string, name: string) {
    const slug = slugify(name);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, parentId }),
    });
    const data = await res.json();
    if (res.ok && data.category) {
      setCategories((prev) => [...prev, data.category]);
    }
  }

  function handleAdd(cat: Category) {
    setCategories((prev) => [...prev, cat]);
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1
          className="text-2xl font-normal text-on-dark"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Categories
        </h1>
        <p className="text-sm text-on-dark-soft mt-1">
          Manage the dropdown categories shown in the navbar under Books, Gifts,
          and Other Products. Click + on any category to add a subcategory
          beneath it — nesting is unlimited.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-on-dark-soft text-sm">
          <Loader2 size={15} className="animate-spin" /> Loading…
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {GROUPS.map(({ key, label }) => {
            const groupCats = categories.filter((c) => c.group === key);
            const tree = buildCategoryTree(categories, key);
            return (
              <div
                key={key}
                className="bg-surface-dark rounded-xl border border-white/8 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                  <h2 className="text-sm font-medium text-on-dark">{label}</h2>
                  <span className="text-xs text-on-dark-soft">
                    {groupCats.length}{" "}
                    {groupCats.length === 1 ? "category" : "categories"}
                  </span>
                </div>
                {tree.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-on-dark-soft/50">
                    No categories yet.
                  </p>
                ) : (
                  tree.map((node) => (
                    <CategoryNodeRow
                      key={node.id}
                      node={node}
                      depth={0}
                      allCategories={categories}
                      onUpdate={handleUpdate}
                      onDelete={handleDelete}
                      onAddChild={handleAddChild}
                    />
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
