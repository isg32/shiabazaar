"use client";

import { useState, useMemo } from "react";
import { Search, ShieldOff, Shield, Mail } from "lucide-react";

const BASE_USERS = [
  { name: "Ahmed K.",   email: "ahmed@example.com",   orders: 8,  spent: "₹4,820", joined: "Jan 2025", status: "Active" },
  { name: "Fatima R.",  email: "fatima@example.com",  orders: 12, spent: "₹7,200", joined: "Feb 2024", status: "Active" },
  { name: "Hussain M.", email: "hussain@example.com", orders: 3,  spent: "₹2,100", joined: "Mar 2025", status: "Active" },
  { name: "Zainab A.",  email: "zainab@example.com",  orders: 5,  spent: "₹1,950", joined: "Nov 2024", status: "Active" },
  { name: "Ali H.",     email: "ali@example.com",     orders: 1,  spent: "₹890",   joined: "Jun 2025", status: "Active" },
  { name: "Sara B.",    email: "sara@example.com",    orders: 15, spent: "₹9,400", joined: "Aug 2023", status: "Active" },
  { name: "Raza M.",    email: "raza@example.com",    orders: 6,  spent: "₹3,200", joined: "Dec 2024", status: "Active" },
  { name: "Noor A.",    email: "noor@example.com",    orders: 2,  spent: "₹760",   joined: "May 2025", status: "Active" },
  { name: "Hassan K.",  email: "hassan@example.com",  orders: 9,  spent: "₹5,100", joined: "Oct 2024", status: "Active" },
  { name: "Maryam T.",  email: "maryam@example.com",  orders: 0,  spent: "₹0",     joined: "Jun 2025", status: "Banned" },
  { name: "Ibrahim S.", email: "ibrahim@example.com", orders: 4,  spent: "₹1,680", joined: "Apr 2025", status: "Banned" },
];

const STATUS_TABS = ["All", "Active", "Banned"];

export default function AdminUsers() {
  const [query,     setQuery]     = useState("");
  const [statusTab, setStatusTab] = useState("All");
  const [users,     setUsers]     = useState(BASE_USERS);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(u =>
      (statusTab === "All" || u.status === statusTab) &&
      (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }, [users, query, statusTab]);

  function toggleBan(email: string) {
    setUsers(prev => prev.map(u =>
      u.email === email ? { ...u, status: u.status === "Banned" ? "Active" : "Banned" } : u
    ));
  }

  const active = users.filter(u => u.status === "Active").length;
  const banned = users.filter(u => u.status === "Banned").length;

  return (
    <div className="px-8 py-8 text-on-dark">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-on-dark">Users</h1>
          <p className="text-sm text-on-dark-soft mt-0.5">{users.length} registered · {active} active · {banned} banned</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-dark-soft" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full h-9 pl-9 pr-3 text-sm bg-surface-dark-elevated border border-white/10 rounded-md text-on-dark placeholder:text-on-dark-soft focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-1 bg-surface-dark-elevated border border-white/8 rounded-md p-0.5 shrink-0">
          {STATUS_TABS.map(f => (
            <button
              key={f}
              onClick={() => setStatusTab(f)}
              className={`px-3 h-7 text-xs font-medium rounded transition-colors ${statusTab === f ? "bg-white/10 text-on-dark" : "text-on-dark-soft hover:text-on-dark"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface-dark-elevated rounded-xl border border-white/8 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {["User", "Orders", "Total Spent", "Joined", "Status", "Actions"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-medium text-on-dark-soft uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-on-dark-soft">No users match your search.</td>
              </tr>
            ) : filtered.map((u, i) => (
              <tr key={u.email} className={`hover:bg-white/3 transition-colors ${i < filtered.length - 1 ? "border-b border-white/8" : ""}`}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-semibold shrink-0">
                      {u.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-on-dark font-medium">{u.name}</p>
                      <p className="text-[11px] text-on-dark-soft">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-on-dark">{u.orders}</td>
                <td className="px-5 py-3.5 text-on-dark font-medium">{u.spent}</td>
                <td className="px-5 py-3.5 text-xs text-on-dark-soft">{u.joined}</td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs font-medium ${u.status === "Active" ? "text-success" : "text-error"}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <button className="w-7 h-7 flex items-center justify-center rounded text-on-dark-soft hover:text-on-dark hover:bg-white/8 transition-colors" title="Email user">
                      <Mail size={13} />
                    </button>
                    <button
                      onClick={() => toggleBan(u.email)}
                      title={u.status === "Banned" ? "Unban" : "Ban"}
                      className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                        u.status === "Banned"
                          ? "text-success hover:bg-success/10"
                          : "text-on-dark-soft hover:text-error hover:bg-error/10"
                      }`}
                    >
                      {u.status === "Banned" ? <Shield size={13} /> : <ShieldOff size={13} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-white/8 flex items-center justify-between">
          <span className="text-xs text-on-dark-soft">{filtered.length} of {users.length} users</span>
          <div className="flex items-center gap-1">
            <button className="h-7 px-3 text-xs text-on-dark-soft bg-white/5 rounded hover:bg-white/10 transition-colors">Prev</button>
            <button className="h-7 px-3 text-xs text-on-dark bg-white/12 rounded">1</button>
            <button className="h-7 px-3 text-xs text-on-dark-soft bg-white/5 rounded hover:bg-white/10 transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
