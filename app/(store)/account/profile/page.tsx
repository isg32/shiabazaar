"use client";

import { useEffect, useState } from "react";
import { Loader2, Check } from "lucide-react";
import { authClient } from "@/lib/auth/client";

const inputCls = "w-full h-10 px-3 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors";
const labelCls = "text-xs font-medium text-muted uppercase tracking-wide block mb-1.5";

type Address = {
  id: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export default function ProfilePage() {
  const session = authClient.useSession();
  const [name, setName]           = useState("");
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    if (!session.data?.user) return;
    setName(session.data.user.name ?? "");
    fetch("/api/account/profile")
      .then(r => r.json())
      .then(d => { if (d.user?.addresses) setAddresses(d.user.addresses); });
  }, [session.data?.user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error ?? "Could not save changes."); }
    else { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    setSaving(false);
  }

  const email = session.data?.user?.email ?? "";

  return (
    <div className="flex flex-col gap-8">
      <h1 className="display-sm text-ink">Profile</h1>

      {/* Personal info */}
      <section className="bg-surface-card rounded-xl p-6 border border-hairline">
        <h2 className="text-sm font-medium text-ink mb-5">Personal Information</h2>
        <form onSubmit={saveProfile}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Full Name</label>
              <input
                className={inputCls}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input className={inputCls} type="email" value={email} disabled />
              <p className="text-xs text-muted mt-1">Email cannot be changed here.</p>
            </div>
          </div>
          {error && <p className="mt-3 text-xs text-error">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="mt-5 h-10 px-6 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saved  && <Check size={14} />}
            {saved ? "Saved" : "Save Changes"}
          </button>
        </form>
      </section>

      {/* Saved addresses */}
      <section className="bg-surface-card rounded-xl p-6 border border-hairline">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-medium text-ink">Saved Addresses</h2>
          <button className="text-xs text-primary hover:text-primary-active font-medium">+ Add New</button>
        </div>
        {addresses.length === 0 ? (
          <p className="text-sm text-muted">No saved addresses yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div key={addr.id} className={`p-4 rounded-lg border ${addr.isDefault ? "border-primary bg-primary/5" : "border-hairline bg-canvas"}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-ink">{addr.label}</p>
                  {addr.isDefault && <span className="text-[10px] font-medium uppercase tracking-wide text-primary">Default</span>}
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  {addr.name}<br />
                  {addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}<br />
                  {addr.city}, {addr.state} — {addr.pincode}
                </p>
                <p className="text-xs text-muted mt-1">{addr.phone}</p>
                <div className="flex gap-3 mt-3">
                  <button className="text-xs text-primary hover:text-primary-active">Edit</button>
                  {!addr.isDefault && <button className="text-xs text-muted hover:text-error">Remove</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
