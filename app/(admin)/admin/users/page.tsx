import { Ban, CheckCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Users" };

const users = [
  { id: "u1", name: "Ali Hussain",   email: "ali@example.com",    joined: "Jan 2025", orders: 12, spent: 12480, banned: false },
  { id: "u2", name: "Fatima Raza",   email: "fatima@example.com", joined: "Feb 2025", orders: 7,  spent: 6340,  banned: false },
  { id: "u3", name: "Ahmed Khan",    email: "ahmed@example.com",  joined: "Mar 2025", orders: 3,  spent: 2100,  banned: false },
  { id: "u4", name: "Zainab Mirza",  email: "zainab@example.com", joined: "Apr 2025", orders: 1,  spent: 699,   banned: true  },
  { id: "u5", name: "Hussain Modi",  email: "h.modi@example.com", joined: "May 2025", orders: 9,  spent: 9870,  banned: false },
];

export default function AdminUsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-ink">Users</h1>
        <input
          type="search"
          placeholder="Search by name or email..."
          className="h-9 px-3 text-xs border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary w-56"
        />
      </div>

      <div className="bg-canvas rounded-xl border border-hairline overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hairline">
              {["Name","Email","Joined","Orders","Total Spent","Status","Actions"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {users.map((u) => (
              <tr key={u.id} className={`hover:bg-surface-soft transition-colors ${u.banned ? "opacity-60" : ""}`}>
                <td className="px-5 py-3 font-medium text-ink">{u.name}</td>
                <td className="px-5 py-3 text-xs text-muted">{u.email}</td>
                <td className="px-5 py-3 text-xs text-muted">{u.joined}</td>
                <td className="px-5 py-3 text-center text-ink">{u.orders}</td>
                <td className="px-5 py-3 font-medium text-ink">₹{u.spent.toLocaleString("en-IN")}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium ${u.banned ? "text-error" : "text-success"}`}>
                    {u.banned ? "Banned" : "Active"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <button className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${u.banned ? "text-success hover:text-success/80" : "text-error hover:text-error/80"}`}>
                    {u.banned ? <><CheckCircle size={13} /> Unban</> : <><Ban size={13} /> Ban</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
