import type { Metadata } from "next";
import Link from "next/link";
import { AlertOctagon, AlertTriangle, ChevronRight } from "lucide-react";
import { loadAlerts, type Alert, type Severity } from "@/lib/bi/alerts";
import { VIZ } from "@/lib/bi/colors";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard — Alerts" };

const SEV: Record<Severity, { label: string; color: string; Icon: typeof AlertOctagon }> = {
  critical: { label: "Critical", color: VIZ.status.critical, Icon: AlertOctagon },
  serious: { label: "Serious", color: VIZ.status.serious, Icon: AlertTriangle },
  warning: { label: "Warning", color: VIZ.status.warning, Icon: AlertTriangle },
};

export default async function Alerts() {
  const alerts = await loadAlerts();
  const groups: Alert["group"][] = ["Credit", "Sales", "Operations"];
  const count = (s: Severity) => alerts.filter((a) => a.severity === s).length;

  return (
    <div className="px-8 py-8 text-on-dark max-w-5xl">
      <h1 className="text-2xl font-semibold text-on-dark">Alerts &amp; exceptions</h1>
      <p className="text-sm text-on-dark-soft mt-0.5 mb-6" data-testid="alert-summary">
        {alerts.length} open · {count("critical")} critical · {count("serious")} serious · {count("warning")} warnings · thresholds in <Link href="/dashboard/settings" className="text-primary">Settings</Link>
      </p>
      {groups.map((g) => {
        const list = alerts.filter((a) => a.group === g);
        return (
          <section key={g} className="mb-6" data-testid={`alerts-${g}`}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-on-dark-soft mb-2">{g} · {list.length}</h2>
            <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
              {list.length === 0 ? (
                <p className="px-5 py-4 text-sm text-on-dark-soft">Nothing to flag.</p>
              ) : list.map((a, i) => {
                const { label, color, Icon } = SEV[a.severity];
                return (
                  <Link key={i} href={a.href} className="flex items-center gap-3 px-5 py-3 border-b border-white/5 last:border-0 hover:bg-white/3">
                    <Icon size={15} style={{ color }} aria-hidden />
                    <span className="text-[11px] w-16 shrink-0 text-on-dark-soft">{label}</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-on-dark truncate">{a.title}</span>
                      <span className="block text-xs text-on-dark-soft truncate">{a.detail}</span>
                    </span>
                    <ChevronRight size={14} className="text-on-dark-soft shrink-0" />
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
