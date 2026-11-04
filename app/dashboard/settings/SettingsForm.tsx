"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const FIELDS = [
  ["paymentTermsDays", "Default payment terms (days)", "Credit becomes overdue after this many days, unless the school/vendor has its own terms."],
  ["creditWatchPct", "Watch at (% of limit used)", "Utilisation from here is marked Watch."],
  ["creditNearPct", "Near limit at (% of limit used)", "Utilisation from here is marked Near limit (100% = Limit reached)."],
  ["inactiveDays", "Inactive after (days without a sale)", "Active schools/vendors with no sale for this long are flagged."],
  ["unusualDiscountPct", "Unusual discount (% off MRP)", "Bills discounted at least this much are flagged on the alerts page."],
] as const;

export default function SettingsForm({ initial, canEdit }: { initial: Record<string, number>; canEdit: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(initial).map(([k, v]) => [k, String(v)])));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true); setMsg(null);
    const res = await fetch("/api/dashboard/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg({ ok: false, text: d.error ?? "Could not save." }); return; }
    setMsg({ ok: true, text: "Saved." });
    router.refresh();
  }

  return (
    <div className="bg-surface-dark-elevated rounded-xl border border-white/8 p-6 max-w-2xl" data-testid="settings-form">
      <div className="flex flex-col gap-5">
        {FIELDS.map(([k, label, help]) => (
          <label key={k} className="flex flex-col gap-1.5">
            <span className="text-sm text-on-dark">{label}</span>
            <input type="number" value={form[k]} disabled={!canEdit} aria-label={label}
              onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
              className="h-9 w-32 px-2 text-sm bg-surface-dark border border-white/20 rounded-md text-on-dark focus:outline-none focus:border-primary disabled:opacity-60" />
            <span className="text-xs text-on-dark-soft">{help}</span>
          </label>
        ))}
      </div>
      {canEdit ? (
        <div className="flex items-center gap-3 mt-6">
          <button onClick={save} disabled={saving} className="h-9 px-5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-active disabled:opacity-50">
            {saving ? "Saving…" : "Save settings"}
          </button>
          {msg && <span className={`text-sm ${msg.ok ? "text-success" : "text-error"}`}>{msg.text}</span>}
        </div>
      ) : (
        <p className="text-xs text-on-dark-soft mt-6">Read-only — only an admin can change these.</p>
      )}
    </div>
  );
}
