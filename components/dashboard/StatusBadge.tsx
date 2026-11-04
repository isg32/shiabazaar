import { AlertOctagon, AlertTriangle, CheckCircle2, Clock, MinusCircle } from "lucide-react";
import { STATUS_LABEL, STATUS_TONE, type CreditStatus } from "@/lib/bi/credit";
import { VIZ } from "@/lib/bi/colors";

const ICON = { good: CheckCircle2, warning: AlertTriangle, serious: AlertTriangle, critical: AlertOctagon, none: MinusCircle };

/** Credit status — always icon + label, never colour alone. */
export default function StatusBadge({ status }: { status: CreditStatus }) {
  const tone = STATUS_TONE[status];
  const Icon = status === "overdue" ? Clock : ICON[tone];
  const color = tone === "none" ? undefined : VIZ.status[tone];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs whitespace-nowrap text-on-dark" data-status={status}>
      <Icon size={13} style={{ color }} className={tone === "none" ? "text-on-dark-soft" : undefined} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
