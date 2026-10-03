import { NextRequest, NextResponse } from "next/server";
import { requireDashboard } from "@/lib/staff-guard";
import { parseFilters } from "@/lib/bi/filters";
import { filterLine, getReport } from "@/lib/bi/reports";
import { toCSV, toPDF, toXLSX } from "@/lib/bi/export";
import { istDay } from "@/lib/bi/period";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Download a report as csv | xlsx | pdf, scoped by the dashboard's URL filters. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireDashboard();
  if (guard) return guard.error;
  const { id } = await params;
  const report = getReport(id);
  if (!report) return NextResponse.json({ error: "Unknown report." }, { status: 404 });

  const sp = Object.fromEntries(req.nextUrl.searchParams.entries());
  const format = sp.format ?? "csv";
  if (!["csv", "xlsx", "pdf"].includes(format)) return NextResponse.json({ error: "format must be csv, xlsx or pdf." }, { status: 400 });

  const f = parseFilters(sp);
  const { cols, rows } = await report.build(f);
  const table = { title: report.title, subtitle: filterLine(f, report.snapshot), cols, rows };
  const name = `shiabazaar-${report.id}-${report.snapshot ? istDay(new Date()) : `${istDay(f.period.from)}_${istDay(new Date(f.period.to.getTime() - 1))}`}`;

  if (format === "csv") {
    return new NextResponse(toCSV(table), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.csv"` },
    });
  }
  const body = format === "xlsx" ? await toXLSX(table) : await toPDF(table);
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": format === "xlsx" ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/pdf",
      "Content-Disposition": `attachment; filename="${name}.${format}"`,
    },
  });
}
