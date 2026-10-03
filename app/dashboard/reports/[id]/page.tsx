import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import FilterBar from "@/components/dashboard/FilterBar";
import ExportLinks from "@/components/dashboard/ExportLinks";
import { parseFilters, withFilters, type SearchParams } from "@/lib/bi/filters";
import { filterLine, getReport } from "@/lib/bi/reports";
import { categoryOptions } from "@/lib/bi/categories";
import { inr } from "@/lib/bi/format";
import type { Col, Row } from "@/lib/bi/export";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Report" };

const LIMIT = 500;

function cell(v: Row[string], c: Col) {
  if (v === null || v === undefined || v === "") return "—";
  if (c.type === "money") return inr(Number(v));
  if (c.type === "pct") return `${v}%`;
  if (c.type === "date") return v instanceof Date ? v.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : String(v);
  return String(v);
}

export default async function ReportView({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }) {
  const { id } = await params;
  const report = getReport(id);
  if (!report) notFound();
  const sp = await searchParams;
  const f = parseFilters(sp);
  const [{ cols, rows }, cats] = await Promise.all([report.build(f), categoryOptions()]);

  return (
    <div className="px-8 py-8 text-on-dark">
      <Link href={withFilters("/dashboard/reports", sp)} className="inline-flex items-center gap-1 text-xs text-on-dark-soft hover:text-on-dark mb-4">
        <ChevronLeft size={13} /> Reports
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">{report.title}</h1>
          <p className="text-sm text-on-dark-soft mt-0.5" data-testid="report-meta">{filterLine(f, report.snapshot)} · {rows.length} rows</p>
        </div>
        <ExportLinks id={report.id} sp={sp} />
      </div>
      <FilterBar categories={cats}>
        <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-x-auto">
          <table className="w-full text-xs" data-testid="report-table">
            <thead>
              <tr className="border-b border-white/8">
                {cols.map((c) => (
                  <th key={c.key} className={`px-3 py-2.5 font-medium text-on-dark-soft uppercase tracking-wide whitespace-nowrap ${c.type === "text" || c.type === "date" ? "text-left" : "text-right"}`}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {rows.length === 0 ? (
                <tr><td colSpan={cols.length} className="px-4 py-10 text-center text-on-dark-soft">No data for this selection.</td></tr>
              ) : rows.slice(0, LIMIT).map((r, i) => (
                <tr key={i} className="border-b border-white/5">
                  {cols.map((c) => (
                    <td key={c.key} className={`px-3 py-2 ${c.type === "text" || c.type === "date" ? "text-left text-on-dark" : "text-right text-on-dark-soft"}`}>{cell(r[c.key], c)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > LIMIT && <p className="px-4 py-3 text-xs text-on-dark-soft">Showing the first {LIMIT} of {rows.length} rows — download for the full report.</p>}
        </div>
      </FilterBar>
    </div>
  );
}
