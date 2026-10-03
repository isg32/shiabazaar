import type { Metadata } from "next";
import Link from "next/link";
import FilterBar from "@/components/dashboard/FilterBar";
import ExportLinks from "@/components/dashboard/ExportLinks";
import { parseFilters, withFilters, type SearchParams } from "@/lib/bi/filters";
import { REPORTS, REPORT_GROUPS } from "@/lib/bi/reports";
import { categoryOptions } from "@/lib/bi/categories";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Reports" };

export default async function ReportLibrary({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const f = parseFilters(sp);
  const cats = await categoryOptions();
  return (
    <div className="px-8 py-8 text-on-dark">
      <h1 className="text-2xl font-semibold text-on-dark">Reports</h1>
      <p className="text-sm text-on-dark-soft mt-0.5 mb-5">{REPORTS.length} reports · {f.period.label} · every report follows the filters below; snapshot reports show the current position.</p>
      <FilterBar categories={cats}>
        <div className="grid xl:grid-cols-2 gap-6" data-testid="report-library">
          {REPORT_GROUPS.map((g) => (
            <section key={g} className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
              <h2 className="px-5 py-3 border-b border-white/8 text-xs font-semibold uppercase tracking-wide text-on-dark-soft">{g}</h2>
              {REPORTS.filter((r) => r.group === g).map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3 border-b border-white/5 last:border-0">
                  <div className="flex-1 min-w-0">
                    <Link href={withFilters(`/dashboard/reports/${r.id}`, sp)} className="text-sm text-on-dark hover:underline">{r.title}</Link>
                    {r.snapshot && <span className="ml-2 text-[10px] uppercase tracking-wide text-on-dark-soft">snapshot</span>}
                    <p className="text-xs text-on-dark-soft truncate">{r.description}</p>
                  </div>
                  <ExportLinks id={r.id} sp={sp} />
                </div>
              ))}
            </section>
          ))}
        </div>
      </FilterBar>
    </div>
  );
}
