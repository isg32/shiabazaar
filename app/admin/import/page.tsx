"use client";

import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import { Upload, AlertCircle, CheckCircle2, Download, FileDown } from "lucide-react";
import { buildCategoryTree, flattenTreeWithDepth, type FlatCategory } from "@/lib/category-tree";

const REQUIRED = ["title", "type", "price"] as const;
const COLUMNS = [
  "title","slug","type","price","original_price","in_stock","stock",
  "badge","category_names","description","author","publisher",
  "language","genre","isbn","edition","page_count",
];
// category_names accepts more than one tag — quote the cell and separate with
// commas, e.g. "Islamic Books,Fiqh". Leaving the column blank on an update
// row leaves that product's existing category tags untouched.
const EXAMPLE_CSV = [
  COLUMNS.join(","),
  'Nahjul Balagha,nahjul-balagha,book,499,699,true,25,BESTSELLER,"Islamic Books,Fiqh",Sermons and letters of Imam Ali (AS),Imam Ali (AS),Tazeem Publication,English,Fiqh,978-0000000001,3rd,650',
  "Tafseer e Namoona Vol 1,,book,350,,true,10,,Islamic Books,Comprehensive Quranic commentary,Ayatollah Makarem Shirazi,Tazeem Publication,Urdu,Tafsir,,1st,480",
  'Alam Panja Brass,,gift,1200,1500,true,,NEW,"Gifts,Brass Items",Hand-crafted brass Alam Panja,,,,,,,',
  "Mashak Small,,gift,850,,true,,,Gifts,Traditional mashak for azadari,,,,,,,",
].join("\n");

type Row = Record<string, string>;
type DuplicateMode = "skip" | "update";
type CatAction = "auto" | "adjust" | "skip";
type UnmatchedCat = { name: string; count: number; types: string[] };
type CatDecision = { action: CatAction; group: string; parentId: string | null };

// A category name in the CSV that isn't type-scoped maps to a group by the
// product type(s) that reference it — categories only have 3 buckets
// (book/gift/other) while products have 5 types, so ladies/gents default to
// "other", matching how the storefront already groups them together there.
function defaultGroupForType(type: string): string {
  const t = type.toLowerCase();
  if (t === "book") return "book";
  if (t === "gift") return "gift";
  return "other";
}

function rowErrors(row: Row): string[] {
  const errs: string[] = [];
  for (const f of REQUIRED) if (!row[f]?.trim()) errs.push(`missing ${f}`);
  if (row.price && isNaN(Number(row.price))) errs.push("price not a number");
  if (row.type) {
    const valid = ["book","gift","ladies","gents","other"];
    if (!valid.includes(row.type.toLowerCase())) errs.push(`unknown type "${row.type}"`);
  }
  return errs;
}

function downloadTemplate() {
  const blob = new Blob([EXAMPLE_CSV], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "shiabazaar-import-template.csv";
  a.click();
}

export default function ImportPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [skipErrors, setSkipErrors] = useState(true);
  const [duplicateMode, setDuplicateMode] = useState<DuplicateMode>("skip");
  const [defaultStock, setDefaultStock] = useState("");
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [result, setResult] = useState<{
    created: number;
    updated: number;
    errors: { row: number; title: string; error: string }[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Unmatched-category resolution: null = not checked yet, [] = checked and
  // clear to import, non-empty = resolution panel is showing.
  const [allCategories, setAllCategories] = useState<FlatCategory[]>([]);
  const [unmatched, setUnmatched] = useState<UnmatchedCat[] | null>(null);
  const [decisions, setDecisions] = useState<Record<string, CatDecision>>({});
  const [checking, setChecking] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const parseFile = useCallback((file: File) => {
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        setRows(data);
        setStep(2);
        setUnmatched(null);
        setDecisions({});
        setResolveError(null);
      },
    });
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const validRows = rows.filter((r) => rowErrors(r).length === 0);
  const badRows = rows.filter((r) => rowErrors(r).length > 0);
  const rowsToImport = skipErrors ? validRows : rows;

  // Triggered by the "Import" button. First pass: fetch the current category
  // list and check every category_names/category_name cell against it. If
  // anything doesn't match, show the resolution panel instead of importing —
  // nothing is created or imported until the admin decides on each name.
  async function handleImportClick() {
    if (unmatched === null) {
      setChecking(true);
      setResolveError(null);
      try {
        const res = await fetch("/api/admin/categories");
        const data = await res.json();
        const cats: FlatCategory[] = data.categories ?? [];
        setAllCategories(cats);

        const known = new Set(cats.map((c) => c.name.toLowerCase()));
        const tally = new Map<string, { name: string; count: number; types: Set<string> }>();
        for (const row of rowsToImport) {
          const raw = row.category_names ?? row.category_name;
          if (!raw) continue;
          for (const name of raw.split(",").map((s) => s.trim()).filter(Boolean)) {
            const lower = name.toLowerCase();
            if (known.has(lower)) continue;
            const entry = tally.get(lower);
            if (entry) { entry.count++; entry.types.add((row.type || "").toLowerCase()); }
            else tally.set(lower, { name, count: 1, types: new Set([(row.type || "").toLowerCase()]) });
          }
        }
        const um: UnmatchedCat[] = [...tally.values()].map((v) => ({ name: v.name, count: v.count, types: [...v.types].filter(Boolean) }));

        if (um.length > 0) {
          const initial: Record<string, CatDecision> = {};
          for (const u of um) initial[u.name] = { action: "auto", group: defaultGroupForType(u.types[0] ?? "other"), parentId: null };
          setDecisions(initial);
          setUnmatched(um);
          setChecking(false);
          return;
        }
        setUnmatched([]);
      } finally {
        setChecking(false);
      }
    }
    await runImport();
  }

  // Called from the resolution panel's "Continue Import" — creates every
  // category marked auto/adjust (via the same bulk category importer used on
  // /admin/categories), then proceeds to the normal product import. Skipped
  // names are left unmatched for this run, same as today but a deliberate
  // choice instead of a silent one.
  async function applyDecisionsAndImport() {
    setResolving(true);
    setResolveError(null);
    const toCreate = (unmatched ?? []).filter((u) => decisions[u.name]?.action !== "skip");
    if (toCreate.length > 0) {
      const rows = toCreate.map((u) => {
        const d = decisions[u.name];
        const parent = d.parentId ? allCategories.find((c) => c.id === d.parentId) : undefined;
        return { name: u.name, group: d.group, parent_name: parent?.name };
      });
      const res = await fetch("/api/admin/categories/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || (data.errors?.length ?? 0) > 0) {
        const detail = data.errors?.length
          ? data.errors.map((e: { name: string; error: string }) => `${e.name} (${e.error})`).join("; ")
          : "request failed";
        setResolveError(`Could not create ${data.errors?.length ?? "some"} categor${data.errors?.length === 1 ? "y" : "ies"}: ${detail}`);
        setResolving(false);
        return;
      }
    }
    setResolving(false);
    setUnmatched([]);
    await runImport();
  }

  async function runImport() {
    setStep(3);
    setTotal(rowsToImport.length);
    setProgress(0);
    setResult(null);

    const BATCH = 50;
    let allCreated = 0;
    let allUpdated = 0;
    const allErrors: { row: number; title: string; error: string }[] = [];

    for (let i = 0; i < rowsToImport.length; i += BATCH) {
      const batch = rowsToImport.slice(i, i + BATCH);
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: batch,
          on_duplicate: duplicateMode,
          ...(defaultStock.trim() !== "" ? { default_stock: Number(defaultStock) } : {}),
        }),
      });
      const data = await res.json();
      allCreated += data.created ?? 0;
      allUpdated += data.updated ?? 0;
      for (const err of data.errors ?? []) {
        allErrors.push({ ...err, row: err.row + i });
      }
      setProgress(Math.min(i + BATCH, rowsToImport.length));
    }

    setResult({ created: allCreated, updated: allUpdated, errors: allErrors });
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-on-dark">Import / Export</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-hairline rounded-md text-on-dark-soft hover:text-on-dark transition-colors"
          >
            <Download size={14} />
            Template
          </button>
          <a
            href="/api/admin/products/export"
            className="flex items-center gap-2 px-4 py-2 text-sm border border-hairline rounded-md text-on-dark-soft hover:text-on-dark transition-colors"
          >
            <FileDown size={14} />
            Export CSV
          </a>
        </div>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-3 mb-8">
        {(["Upload", "Preview", "Import"] as const).map((label, i) => {
          const s = (i + 1) as 1 | 2 | 3;
          return (
            <div key={s} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${step >= s ? "bg-primary text-white" : "bg-surface-dark-elevated text-on-dark-soft"}`}>
                {s}
              </div>
              <span className={`text-sm ${step >= s ? "text-on-dark" : "text-on-dark-soft"}`}>{label}</span>
              {i < 2 && <div className="w-12 h-px bg-hairline" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-hairline rounded-xl p-16 text-center cursor-pointer hover:border-primary/60 transition-colors"
        >
          <Upload size={36} className="mx-auto text-on-dark-soft mb-4" />
          <p className="text-on-dark font-medium mb-1">Drop a CSV file here</p>
          <p className="text-sm text-on-dark-soft">or click to browse</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])}
          />
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <span className="text-on-dark">{rows.length} rows parsed</span>

            {badRows.length > 0 && (
              <span className="text-error flex items-center gap-1">
                <AlertCircle size={14} />
                {badRows.length} rows have errors
              </span>
            )}

            {badRows.length > 0 && (
              <label className="flex items-center gap-2 text-on-dark-soft cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipErrors}
                  onChange={(e) => setSkipErrors(e.target.checked)}
                  className="accent-primary"
                />
                Skip errored rows
              </label>
            )}

            {/* Default stock for rows without a `stock` value */}
            <label className="flex items-center gap-2 text-on-dark-soft ml-auto">
              <span className="text-xs whitespace-nowrap">Default stock</span>
              <input
                type="number"
                min={0}
                value={defaultStock}
                onChange={(e) => setDefaultStock(e.target.value)}
                placeholder="0"
                title="Applied to rows whose 'stock' cell is blank"
                className="w-20 h-7 px-2 text-xs bg-surface-dark border border-white/10 rounded text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary"
              />
            </label>

            {/* Duplicate mode */}
            <div className="flex items-center gap-2 text-on-dark-soft">
              <span className="text-xs">If slug exists:</span>
              <div className="flex rounded-md overflow-hidden border border-hairline text-xs">
                {(["skip", "update"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDuplicateMode(mode)}
                    className={`px-3 py-1 font-medium capitalize transition-colors ${
                      duplicateMode === mode
                        ? "bg-primary text-white"
                        : "text-on-dark-soft hover:text-on-dark"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto rounded-lg border border-hairline">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-surface-dark-elevated text-on-dark-soft">
                  <th className="text-left px-3 py-2 font-medium">#</th>
                  <th className="text-left px-3 py-2 font-medium">Title</th>
                  <th className="text-left px-3 py-2 font-medium">Type</th>
                  <th className="text-left px-3 py-2 font-medium">Price</th>
                  <th className="text-left px-3 py-2 font-medium">Categories</th>
                  <th className="text-left px-3 py-2 font-medium">Issues</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((row, i) => {
                  const errs = rowErrors(row);
                  return (
                    <tr key={i} className={`border-t border-hairline ${errs.length ? "bg-error/10" : ""}`}>
                      <td className="px-3 py-2 text-on-dark-soft">{i + 1}</td>
                      <td className="px-3 py-2 text-on-dark max-w-[180px] truncate">{row.title}</td>
                      <td className="px-3 py-2 text-on-dark-soft">{row.type}</td>
                      <td className="px-3 py-2 text-on-dark-soft">{row.price}</td>
                      <td className="px-3 py-2 text-on-dark-soft max-w-[120px] truncate">{row.category_names}</td>
                      <td className="px-3 py-2 text-error">{errs.join(", ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length > 20 && (
              <div className="px-3 py-2 text-xs text-on-dark-soft border-t border-hairline">
                …and {rows.length - 20} more rows (not shown)
              </div>
            )}
          </div>

          {/* Unmatched-category resolution — only shown once handleImportClick has
              found names that don't exist yet. Nothing is created until "Continue Import". */}
          {unmatched && unmatched.length > 0 && (
            <div className="border border-accent-amber/40 rounded-lg overflow-hidden">
              <div className="bg-accent-amber/10 px-4 py-3">
                <p className="text-sm font-medium text-on-dark flex items-center gap-2">
                  <AlertCircle size={14} className="text-accent-amber" />
                  {unmatched.length} categor{unmatched.length === 1 ? "y" : "ies"} in this file{" "}
                  {unmatched.length === 1 ? "doesn't" : "don't"} exist yet
                </p>
                <p className="text-xs text-on-dark-soft mt-1">
                  Choose what to do with each before importing.
                </p>
              </div>
              <div className="divide-y divide-hairline">
                {unmatched.map((u) => {
                  const d = decisions[u.name];
                  if (!d) return null;
                  const parentOptions = flattenTreeWithDepth(buildCategoryTree(allCategories, d.group));
                  return (
                    <div key={u.name} className="px-4 py-3 flex flex-wrap items-center gap-3">
                      <div className="min-w-[140px]">
                        <p className="text-sm text-on-dark font-medium">{u.name}</p>
                        <p className="text-xs text-on-dark-soft">
                          {u.count} row{u.count === 1 ? "" : "s"}
                          {u.types.length > 0 ? ` · ${u.types.join(", ")}` : ""}
                        </p>
                      </div>
                      <div className="flex rounded-md overflow-hidden border border-hairline text-xs shrink-0">
                        {(["auto", "adjust", "skip"] as const).map((action) => (
                          <button
                            key={action}
                            type="button"
                            onClick={() => setDecisions((prev) => ({ ...prev, [u.name]: { ...prev[u.name], action } }))}
                            className={`px-3 py-1.5 font-medium capitalize transition-colors ${
                              d.action === action ? "bg-primary text-white" : "text-on-dark-soft hover:text-on-dark"
                            }`}
                          >
                            {action === "auto" ? "Auto-create" : action}
                          </button>
                        ))}
                      </div>
                      {d.action !== "skip" && (
                        <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                          <select
                            value={d.group}
                            onChange={(e) =>
                              setDecisions((prev) => ({ ...prev, [u.name]: { ...prev[u.name], group: e.target.value, parentId: null } }))
                            }
                            className="h-7 px-2 text-xs bg-surface-dark border border-white/10 rounded text-on-dark focus:outline-none focus:border-primary"
                          >
                            <option value="book">Books</option>
                            <option value="gift">Gifts</option>
                            <option value="other">Other Products</option>
                          </select>
                          {d.action === "adjust" && (
                            <select
                              value={d.parentId ?? ""}
                              onChange={(e) =>
                                setDecisions((prev) => ({ ...prev, [u.name]: { ...prev[u.name], parentId: e.target.value || null } }))
                              }
                              className="h-7 px-2 text-xs bg-surface-dark border border-white/10 rounded text-on-dark flex-1 min-w-0 focus:outline-none focus:border-primary"
                            >
                              <option value="">— top-level —</option>
                              {parentOptions.map(({ node, depth }) => (
                                <option key={node.id} value={node.id}>
                                  {depth > 0 ? "-".repeat(depth) + " " : ""}
                                  {node.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {resolveError && <p className="px-4 py-2 text-xs text-error border-t border-hairline">{resolveError}</p>}
              <div className="px-4 py-3 flex items-center gap-3 bg-surface-dark-elevated">
                <button
                  type="button"
                  onClick={() => { setUnmatched(null); setDecisions({}); setResolveError(null); }}
                  disabled={resolving}
                  className="px-3 py-1.5 text-xs border border-hairline rounded-md text-on-dark-soft hover:text-on-dark disabled:opacity-40"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={applyDecisionsAndImport}
                  disabled={resolving}
                  className="px-4 py-1.5 text-xs bg-primary text-white rounded-md hover:bg-primary-active disabled:opacity-50"
                >
                  {resolving ? "Creating categories…" : "Continue Import"}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setRows([]); setStep(1); setUnmatched(null); setDecisions({}); }}
              className="px-4 py-2 text-sm border border-hairline rounded-md text-on-dark-soft hover:text-on-dark"
            >
              Back
            </button>
            {!(unmatched && unmatched.length > 0) && (
              <button
                onClick={handleImportClick}
                disabled={rowsToImport.length === 0 || checking}
                className="px-5 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-active disabled:opacity-40"
              >
                {checking ? "Checking categories…" : `Import ${rowsToImport.length} rows`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Progress + Results */}
      {step === 3 && (
        <div className="space-y-6">
          {!result ? (
            <div className="space-y-4">
              <p className="text-sm text-on-dark">Importing {progress} / {total}…</p>
              <div className="w-full bg-surface-dark-elevated rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-300"
                  style={{ width: total ? `${(progress / total) * 100}%` : "0%" }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="text-success shrink-0" />
                <div>
                  <p className="text-on-dark font-medium">
                    {result.created} created
                    {result.updated > 0 && `, ${result.updated} updated`}
                  </p>
                  {result.errors.length > 0 && (
                    <p className="text-sm text-error mt-0.5">{result.errors.length} rows failed</p>
                  )}
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="border border-error/30 rounded-lg overflow-hidden">
                  <div className="bg-error/10 px-4 py-2 text-xs font-medium text-error uppercase tracking-wide">
                    Failed rows
                  </div>
                  <div className="divide-y divide-hairline">
                    {result.errors.map((e, i) => (
                      <div key={i} className="px-4 py-2 flex gap-4 text-sm">
                        <span className="text-on-dark-soft w-12 shrink-0">Row {e.row}</span>
                        <span className="text-on-dark truncate">{e.title}</span>
                        <span className="text-error ml-auto shrink-0">{e.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setStep(1); setRows([]); setResult(null); setUnmatched(null); setDecisions({}); }}
                  className="px-4 py-2 text-sm border border-hairline rounded-md text-on-dark-soft hover:text-on-dark"
                >
                  Import another file
                </button>
                <a
                  href="/admin/products"
                  className="px-5 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-active"
                >
                  View products
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
