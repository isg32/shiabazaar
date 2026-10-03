import Link from "next/link";

export type ShareRow = { key: string; label: string; value: number; valueText: string; color: string; sub?: string; href?: string };

/** Directly-labelled horizontal bars for part-to-whole (≤ 6 rows). Every value is printed, so no tooltip gates anything. */
export default function ShareBars({ rows, title }: { rows: ShareRow[]; title: string }) {
  const total = rows.reduce((s, r) => s + Math.max(r.value, 0), 0);
  return (
    <figure className="bg-surface-dark-elevated rounded-xl border border-white/8 p-5" data-testid="share-bars">
      <figcaption className="text-sm font-medium text-on-dark mb-4">{title}</figcaption>
      {total === 0 ? (
        <p className="text-sm text-on-dark-soft text-center py-6">No sales in this period.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => {
            const share = total ? Math.round((Math.max(r.value, 0) / total) * 1000) / 10 : 0;
            const label = (
              <span className="flex items-center gap-2 text-sm text-on-dark">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: r.color }} />
                {r.label}
              </span>
            );
            return (
              <div key={r.key}>
                <div className="flex items-baseline justify-between gap-3 mb-1.5">
                  {r.href ? <Link href={r.href} className="hover:underline">{label}</Link> : label}
                  <span className="text-sm tabular-nums">
                    <span className="text-on-dark font-medium">{r.valueText}</span>
                    <span className="text-on-dark-soft ml-2">{share}%</span>
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-r" style={{ width: `${share}%`, background: r.color }} />
                </div>
                {r.sub && <p className="text-[11px] text-on-dark-soft mt-1">{r.sub}</p>}
              </div>
            );
          })}
        </div>
      )}
    </figure>
  );
}
