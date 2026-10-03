import { VIZ } from "@/lib/bi/colors";

/** Credit utilisation meter: fill carries severity, track is a quiet step of the surface. */
export default function Meter({ pct, status }: { pct: number | null; status: keyof typeof VIZ.status | "none" }) {
  if (pct == null) return <span className="text-xs text-on-dark-soft">no limit</span>;
  const w = Math.max(0, Math.min(pct, 100));
  return (
    <div className="flex items-center gap-2" title={`${pct}% of limit used`}>
      <div className="w-24 h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${w}%`, background: status === "none" ? VIZ.status.good : VIZ.status[status] }} />
      </div>
      <span className="text-xs text-on-dark-soft tabular-nums">{pct}%</span>
    </div>
  );
}
