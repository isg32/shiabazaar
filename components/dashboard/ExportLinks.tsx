import { Download } from "lucide-react";
import { withFilters, type SearchParams } from "@/lib/bi/filters";

/** CSV / Excel / PDF download links for a report under the current filters. */
export default function ExportLinks({ id, sp }: { id: string; sp: SearchParams }) {
  return (
    <span className="inline-flex items-center gap-1" data-testid={`export-${id}`}>
      {(["csv", "xlsx", "pdf"] as const).map((fmt) => (
        <a key={fmt} href={withFilters(`/api/dashboard/reports/${id}`, sp, { format: fmt, page: null })}
          className="h-7 px-2 inline-flex items-center gap-1 text-[11px] rounded-md bg-white/5 text-on-dark-soft hover:text-on-dark hover:bg-white/10">
          <Download size={11} /> {fmt === "xlsx" ? "Excel" : fmt.toUpperCase()}
        </a>
      ))}
    </span>
  );
}
