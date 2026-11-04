"use client";

import { useState, useEffect } from "react";
import { Loader2, Check, ChevronDown } from "lucide-react";

interface ReturnItem {
  id: string;
  orderId: string;
  reason: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  order: {
    id: string;
    total: number;
    user: { name: string | null; email: string } | null;
  };
}

const STATUS_OPTIONS = ["requested", "approved", "rejected", "completed"];
const STATUS_STYLES: Record<string, string> = {
  requested:  "bg-white/8 text-on-dark-soft",
  approved:   "bg-success/12 text-success",
  rejected:   "bg-error/10 text-error",
  completed:  "bg-accent-amber/15 text-accent-amber",
};

function orderRef(id: string) { return `#SB-${id.slice(0, 8).toUpperCase()}`; }

export default function AdminReturns() {
  const [returns,  setReturns]  = useState<ReturnItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [openDrop, setOpenDrop] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});
  const [editNote,  setEditNote]  = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/returns")
      .then(r => r.json())
      .then(d => { setReturns(d.returns ?? []); setLoading(false); });
  }, []);

  async function setStatus(id: string, status: string) {
    await fetch(`/api/admin/returns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setReturns(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    setOpenDrop(null);
  }

  async function saveNote(id: string) {
    const note = (noteInput[id] ?? "").trim();
    await fetch(`/api/admin/returns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNote: note }),
    });
    setReturns(prev => prev.map(r => r.id === id ? { ...r, adminNote: note } : r));
    setEditNote(null);
  }

  return (
    <div className="px-8 py-8 text-on-dark" onClick={() => setOpenDrop(null)}>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-on-dark">Return Requests</h1>
        <p className="text-sm text-on-dark-soft mt-0.5">{returns.length} total requests</p>
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
                {["Order", "Customer", "Reason", "Admin Note", "Status", "Date", "Actions"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {returns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-on-dark-soft">No return requests yet.</td>
                </tr>
              ) : returns.map((r, i) => (
                <tr key={r.id} className={`hover:bg-white/3 transition-colors ${i < returns.length - 1 ? "border-b border-white/8" : ""}`}>
                  <td className="px-5 py-3.5 font-mono text-xs text-on-dark-soft">{orderRef(r.orderId)}</td>
                  <td className="px-5 py-3.5">
                    <p className="text-on-dark font-medium">{r.order.user?.name ?? "Guest"}</p>
                    <p className="text-[11px] text-on-dark-soft">{r.order.user?.email ?? ""}</p>
                  </td>
                  <td className="px-5 py-3.5 max-w-[200px]">
                    <p className="text-xs text-on-dark-soft leading-relaxed line-clamp-3">{r.reason}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    {editNote === r.id ? (
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <input
                          autoFocus
                          value={noteInput[r.id] ?? ""}
                          onChange={e => setNoteInput(prev => ({ ...prev, [r.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === "Enter") saveNote(r.id); if (e.key === "Escape") setEditNote(null); }}
                          placeholder="Add note…"
                          className="w-32 h-7 px-2 text-xs bg-surface-dark border border-white/20 rounded text-on-dark focus:outline-none focus:border-primary"
                        />
                        <button onClick={() => saveNote(r.id)} className="w-6 h-6 flex items-center justify-center rounded bg-success/15 text-success hover:bg-success/25">
                          <Check size={11} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditNote(r.id); setNoteInput(prev => ({ ...prev, [r.id]: r.adminNote ?? "" })); }}
                        className="text-xs text-on-dark-soft underline hover:text-on-dark"
                      >
                        {r.adminNote || "Add note"}
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize ${STATUS_STYLES[r.status] ?? "bg-white/8 text-on-dark-soft"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-on-dark-soft">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                  </td>
                  <td className="px-5 py-3.5 relative">
                    <button
                      onClick={e => { e.stopPropagation(); setOpenDrop(openDrop === r.id ? null : r.id); }}
                      className="flex items-center gap-1 text-xs text-on-dark-soft bg-white/6 hover:bg-white/10 px-2.5 py-1 rounded transition-colors"
                    >
                      Status <ChevronDown size={11} />
                    </button>
                    {openDrop === r.id && (
                      <div
                        onClick={e => e.stopPropagation()}
                        className="absolute right-4 top-9 z-20 bg-surface-dark-elevated border border-white/12 rounded-lg shadow-xl py-1 min-w-[140px]"
                      >
                        {STATUS_OPTIONS.map(s => (
                          <button
                            key={s}
                            onClick={() => setStatus(r.id, s)}
                            className={`w-full text-left px-3 py-2 text-xs capitalize transition-colors flex items-center justify-between gap-2 ${r.status === s ? "text-primary" : "text-on-dark-soft hover:text-on-dark hover:bg-white/5"}`}
                          >
                            {s}
                            {r.status === s && <Check size={11} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
