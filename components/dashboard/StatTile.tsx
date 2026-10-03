import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

/** Stat tile: label · value · optional delta vs a named previous period. Whole tile links to its drill-down. */
export default function StatTile({
  label, value, sub, delta, upIsGood = true, href, emphasis = false,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number | null; // percent
  upIsGood?: boolean;
  href?: string;
  emphasis?: boolean;
}) {
  const body = (
    <>
      <p className="text-xs text-on-dark-soft">{label}</p>
      <p className={`${emphasis ? "text-3xl" : "text-xl"} font-semibold text-on-dark mt-1`}>{value}</p>
      <div className="flex items-center gap-2 mt-1 min-h-4">
        {delta != null && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
              delta === 0 ? "text-on-dark-soft" : (delta > 0) === upIsGood ? "text-success" : "text-error"
            }`}
          >
            {delta > 0 ? <ArrowUpRight size={12} /> : delta < 0 ? <ArrowDownRight size={12} /> : null}
            {delta > 0 ? "+" : ""}{delta}%
          </span>
        )}
        {sub && <span className="text-[11px] text-on-dark-soft/70">{sub}</span>}
      </div>
    </>
  );
  const cls = "block bg-surface-dark-elevated rounded-xl p-4 border border-white/8";
  return href ? (
    <Link href={href} className={`${cls} hover:border-white/20 transition-colors`} data-testid={`tile-${label}`}>{body}</Link>
  ) : (
    <div className={cls} data-testid={`tile-${label}`}>{body}</div>
  );
}
