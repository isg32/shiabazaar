/** ₹ from paise with Indian lakh/crore compaction. Client-safe. */
export function inr(paise: number): string {
  const r = paise / 100;
  const abs = Math.abs(r);
  if (abs >= 1e7) return `₹${(r / 1e7).toFixed(2)}Cr`;
  if (abs >= 1e5) return `₹${(r / 1e5).toFixed(2)}L`;
  return `₹${r.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

/** Compact axis label: ₹0, ₹500, ₹1.2K, ₹3.4L. */
export function inrAxis(paise: number): string {
  const r = paise / 100;
  const abs = Math.abs(r);
  if (abs >= 1e7) return `₹${+(r / 1e7).toFixed(1)}Cr`;
  if (abs >= 1e5) return `₹${+(r / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `₹${+(r / 1e3).toFixed(1)}K`;
  return `₹${Math.round(r)}`;
}

export const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 1000) / 10 : 0);
