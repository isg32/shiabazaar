"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Plus, X } from "lucide-react";

type School = {
  id: string;
  name: string;
  code: string | null;
  contactName: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  creditLimit: number;
  balance: number;
  active: boolean;
  _count: { orders: number; payments: number };
};

const EMPTY = { name: "", contactName: "", phone: "", email: "", city: "", state: "", creditLimit: "", paymentTermsDays: "" };

export default function DeskSchools() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [query,   setQuery]   = useState("");
  const [adding,  setAdding]  = useState(false);
  const [form,    setForm]    = useState({ ...EMPTY });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/desk/schools")
      .then((r) => r.json())
      .then((d) => { setSchools(d.schools ?? []); setLoading(false); });
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      (s.code ?? "").toLowerCase().includes(q) ||
      (s.city ?? "").toLowerCase().includes(q) ||
      (s.contactName ?? "").toLowerCase().includes(q)
    );
  }, [schools, query]);

  const totalOutstanding = schools.filter((s) => s.active).reduce((sum, s) => sum + Math.max(s.balance, 0), 0);

  async function create() {
    setError(null);
    if (!form.name.trim()) { setError("School name is required."); return; }
    setSaving(true);
    const res = await fetch("/api/desk/schools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Could not create the school.");
      return;
    }
    setForm({ ...EMPTY });
    setAdding(false);
    load();
  }

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Schools</h1>
          <p className="text-sm text-on-dark-soft mt-0.5">
            Book-credit accounts · ₹{(totalOutstanding / 100).toFixed(0)} outstanding across active schools
          </p>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="h-9 px-4 bg-primary text-white text-sm font-medium rounded-md flex items-center gap-2 hover:bg-primary-active transition-colors"
        >
          {adding ? <X size={14} /> : <Plus size={14} />} {adding ? "Close" : "Add School"}
        </button>
      </div>

      {adding && (
        <div className="bg-surface-dark-elevated rounded-xl border border-white/8 p-5 mb-5">
          <div className="grid sm:grid-cols-3 gap-3">
            {([
              ["name", "School name *"],
              ["contactName", "Contact person"],
              ["phone", "Phone"],
              ["email", "Email"],
              ["city", "City"],
              ["state", "State"],
              ["creditLimit", "Credit limit (₹, 0 = none)"],
              ["paymentTermsDays", "Payment terms (days, blank = default)"],
            ] as const).map(([field, label]) => (
              <label key={field} className="flex flex-col gap-1.5">
                <span className="text-xs text-on-dark-soft">{label}</span>
                <input
                  value={form[field]}
                  onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                  type={field === "creditLimit" || field === "paymentTermsDays" ? "number" : "text"}
                  className="h-9 px-2 text-sm bg-surface-dark border border-white/20 rounded-md text-on-dark focus:outline-none focus:border-primary"
                />
              </label>
            ))}
          </div>
          <p className="text-xs text-on-dark-soft mt-3">A school code (SCH-0001, …) is assigned automatically.</p>
          {error && <p className="text-sm text-error mt-3">{error}</p>}
          <div className="flex justify-end mt-4">
            <button
              onClick={create} disabled={saving}
              className="h-9 px-5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-active transition-colors disabled:opacity-50"
            >
              {saving ? "Saving…" : "Create school"}
            </button>
          </div>
        </div>
      )}

      <div className="relative mb-5">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-dark-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, code, city or contact…"
          className="w-full h-9 pl-9 pr-3 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary"
        />
      </div>

      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-on-dark-soft">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {["School", "Contact", "Outstanding", "Credit limit", "Status"].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-on-dark-soft">
                  {schools.length === 0 ? "No schools yet." : "No schools match your search."}
                </td></tr>
              ) : filtered.map((s, i) => {
                const nearLimit = s.creditLimit > 0 && s.balance >= s.creditLimit * 0.9;
                return (
                  <tr
                    key={s.id}
                    onClick={() => router.push(`/desk/schools/${s.id}`)}
                    className={`hover:bg-white/3 transition-colors cursor-pointer ${i < filtered.length - 1 ? "border-b border-white/8" : ""}`}
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-on-dark font-medium">{s.name}</p>
                      {s.code && <p className="text-[11px] font-mono text-on-dark-soft">{s.code}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-on-dark-soft">
                      {s.contactName ?? "—"}{s.phone ? ` · ${s.phone}` : ""}
                      {(s.city || s.state) && <p className="text-[11px] text-on-dark-soft/70">{[s.city, s.state].filter(Boolean).join(", ")}</p>}
                    </td>
                    <td className={`px-5 py-3.5 font-medium ${s.balance > 0 ? (nearLimit ? "text-accent-amber" : "text-error") : s.balance < 0 ? "text-success" : "text-on-dark-soft"}`}>
                      {s.balance < 0 ? `₹${(-s.balance / 100).toFixed(0)} advance` : `₹${(s.balance / 100).toFixed(0)}`}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-on-dark-soft">
                      {s.creditLimit > 0 ? `₹${(s.creditLimit / 100).toFixed(0)}` : "none"}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${s.active ? "bg-success/10 text-success" : "bg-white/5 text-on-dark-soft"}`}>
                        {s.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <div className="px-5 py-3 border-t border-white/8">
          <span className="text-xs text-on-dark-soft">Showing {filtered.length} of {schools.length} schools</span>
        </div>
      </div>
    </div>
  );
}
