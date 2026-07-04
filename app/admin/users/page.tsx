"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, ShieldOff, Shield, Loader2 } from "lucide-react";

interface User {
  id: string;
  name?: string | null;
  email: string;
  banned: boolean;
  createdAt: string;
}

const STATUS_TABS = ["All", "Active", "Banned"];

export default function AdminUsers() {
  const [query,     setQuery]     = useState("");
  const [statusTab, setStatusTab] = useState("All");
  const [users,     setUsers]     = useState<User[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(d => { setUsers(d.users ?? []); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(u =>
      (statusTab === "All" || (statusTab === "Banned" ? u.banned : !u.banned)) &&
      (!q || (u.name ?? "").toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }, [users, query, statusTab]);

  async function toggleBan(id: string, banned: boolean) {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banned }),
    });
    setUsers(prev => prev.map(u => u.id === id ? { ...u, banned } : u));
  }

  const active = users.filter(u => !u.banned).length;
  const banned = users.filter(u => u.banned).length;

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Users</h1>
          <p className="text-sm text-on-dark-soft mt-0.5">{users.length} registered · {active} active · {banned} banned</p>
        </div>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1 bg-surface-dark-elevated border border-white/8 rounded-md p-0.5">
          {STATUS_TABS.map(t => (
            <button
              key={t}
              onClick={() => setStatusTab(t)}
              className={`px-3 h-7 text-xs font-medium rounded transition-colors ${statusTab === t ? "bg-white/10 text-on-dark" : "text-on-dark-soft hover:text-on-dark"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-dark-soft" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full h-9 pl-9 pr-3 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-on-dark-soft">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {["User", "Status", "Joined", "Actions"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-on-dark-soft">
                  {users.length === 0 ? "No registered users yet." : "No users match your search."}
                </td>
              </tr>
            ) : filtered.map((u, i) => (
              <tr key={u.id} className={`hover:bg-white/3 transition-colors ${i < filtered.length - 1 ? "border-b border-white/8" : ""}`}>
                <td className="px-5 py-3.5">
                  <p className="text-on-dark font-medium">{u.name ?? "(no name)"}</p>
                  <p className="text-[11px] text-on-dark-soft">{u.email}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${u.banned ? "bg-error/10 text-error" : "bg-success/10 text-success"}`}>
                    {u.banned ? "Banned" : "Active"}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-xs text-on-dark-soft">
                  {new Date(u.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                </td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => toggleBan(u.id, !u.banned)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded font-medium transition-colors ${
                      u.banned
                        ? "bg-success/10 text-success hover:bg-success/20"
                        : "bg-error/10 text-error hover:bg-error/20"
                    }`}
                  >
                    {u.banned ? <><Shield size={12} /> Unban</> : <><ShieldOff size={12} /> Ban</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
        <div className="px-5 py-3 border-t border-white/8">
          <span className="text-xs text-on-dark-soft">Showing {filtered.length} of {users.length} users</span>
        </div>
      </div>
    </div>
  );
}
