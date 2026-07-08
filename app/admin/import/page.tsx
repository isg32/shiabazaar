"use client";

import { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import { Upload, AlertCircle, CheckCircle2, Download } from "lucide-react";

const REQUIRED = ["title", "type", "price"] as const;
const COLUMNS = [
  "title","slug","type","price","original_price","in_stock",
  "badge","category_name","description","author","publisher",
  "language","genre","isbn","edition","page_count",
];
const EXAMPLE_CSV = [
  COLUMNS.join(","),
  "Nahjul Balagha,nahjul-balagha,book,499,699,true,BESTSELLER,Islamic Books,Sermons and letters of Imam Ali (AS),Imam Ali (AS),Tazeem Publication,English,Fiqh,978-0000000001,3rd,650",
  "Tafseer e Namoona Vol 1,,book,350,,true,,Islamic Books,Comprehensive Quranic commentary,Ayatollah Makarem Shirazi,Tazeem Publication,Urdu,Tafsir,,1st,480",
  "Alam Panja Brass,,gift,1200,1500,true,NEW,Gifts,Hand-crafted brass Alam Panja,,,,,,,",
  "Mashak Small,,gift,850,,true,,Gifts,Traditional mashak for azadari,,,,,,,",
].join("\n");

type Row = Record<string, string>;

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
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [result, setResult] = useState<{ created: number; errors: { row: number; title: string; error: string }[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

  const parseFile = useCallback((file: File) => {
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        setRows(data);
        setStep(2);
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

  async function runImport() {
    setStep(3);
    setTotal(rowsToImport.length);
    setProgress(0);
    setResult(null);

    const BATCH = 50;
    let allCreated = 0;
    const allErrors: { row: number; title: string; error: string }[] = [];

    for (let i = 0; i < rowsToImport.length; i += BATCH) {
      const batch = rowsToImport.slice(i, i + BATCH);
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: batch }),
      });
      const data = await res.json();
      allCreated += data.created ?? 0;
      for (const err of data.errors ?? []) {
        allErrors.push({ ...err, row: err.row + i });
      }
      setProgress(Math.min(i + BATCH, rowsToImport.length));
    }

    setResult({ created: allCreated, errors: allErrors });
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-on-dark">Bulk Import Products</h1>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-hairline rounded-md text-on-dark-soft hover:text-on-dark transition-colors"
        >
          <Download size={14} />
          Download Template
        </button>
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
          ref={dragRef}
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
          <div className="flex items-center gap-4 text-sm">
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
                  <th className="text-left px-3 py-2 font-medium">Category</th>
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
                      <td className="px-3 py-2 text-on-dark-soft max-w-[120px] truncate">{row.category_name}</td>
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setRows([]); setStep(1); }}
              className="px-4 py-2 text-sm border border-hairline rounded-md text-on-dark-soft hover:text-on-dark"
            >
              Back
            </button>
            <button
              onClick={runImport}
              disabled={rowsToImport.length === 0}
              className="px-5 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary-active disabled:opacity-40"
            >
              Import {rowsToImport.length} rows
            </button>
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
                  <p className="text-on-dark font-medium">{result.created} products imported successfully</p>
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
                  onClick={() => { setStep(1); setRows([]); setResult(null); }}
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
