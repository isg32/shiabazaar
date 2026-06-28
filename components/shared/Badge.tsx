import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "coral" | "amber" | "success" | "error";

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-surface-card text-ink",
  coral:   "bg-primary text-on-primary",
  amber:   "bg-accent-amber text-ink",
  success: "bg-success text-white",
  error:   "bg-error text-white",
};

const badgeMap: Record<string, BadgeVariant> = {
  NEW: "coral",
  BESTSELLER: "coral",
  FEATURED: "coral",
  SALE: "amber",
  "OUT OF STOCK": "error",
  "IN STOCK": "success",
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ label, variant, className }: BadgeProps) {
  const v = variant ?? badgeMap[label] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium uppercase tracking-[1.5px] whitespace-nowrap",
        variants[v],
        className
      )}
    >
      {label}
    </span>
  );
}
