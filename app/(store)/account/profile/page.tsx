import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profile" };

const inputCls = "w-full h-10 px-3 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors";
const labelCls = "text-xs font-medium text-muted uppercase tracking-wide block mb-1.5";

const savedAddresses = [
  { id: 1, label: "Home", line1: "123, Hazrat Abbas Lane", line2: "Mumbai, Maharashtra — 400001", default: true },
  { id: 2, label: "Office", line1: "45, Business Park, Andheri East", line2: "Mumbai, Maharashtra — 400069", default: false },
];

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="display-sm text-ink">Profile</h1>

      {/* Personal info */}
      <section className="bg-surface-card rounded-xl p-6 border border-hairline">
        <h2 className="text-sm font-medium text-ink mb-5">Personal Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>First Name</label>
            <input className={inputCls} defaultValue="Ali" />
          </div>
          <div>
            <label className={labelCls}>Last Name</label>
            <input className={inputCls} defaultValue="Hussain" />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} type="email" defaultValue="ali@example.com" disabled />
            <p className="text-xs text-muted mt-1">Email cannot be changed here. Contact support.</p>
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input className={inputCls} type="tel" defaultValue="+91 98765 43210" />
          </div>
        </div>
        <button className="mt-5 h-10 px-6 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors">
          Save Changes
        </button>
      </section>

      {/* Saved addresses */}
      <section className="bg-surface-card rounded-xl p-6 border border-hairline">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-medium text-ink">Saved Addresses</h2>
          <button className="text-xs text-primary hover:text-primary-active font-medium">+ Add New</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {savedAddresses.map((addr) => (
            <div key={addr.id} className={`p-4 rounded-lg border ${addr.default ? "border-primary bg-primary/5" : "border-hairline bg-canvas"}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-ink">{addr.label}</p>
                {addr.default && <span className="text-[10px] font-medium uppercase tracking-wide text-primary">Default</span>}
              </div>
              <p className="text-xs text-muted leading-relaxed">{addr.line1}<br />{addr.line2}</p>
              <div className="flex gap-3 mt-3">
                <button className="text-xs text-primary hover:text-primary-active">Edit</button>
                {!addr.default && <button className="text-xs text-muted hover:text-error">Remove</button>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Change password */}
      <section className="bg-surface-card rounded-xl p-6 border border-hairline">
        <h2 className="text-sm font-medium text-ink mb-5">Change Password</h2>
        <div className="flex flex-col gap-4 max-w-sm">
          <div>
            <label className={labelCls}>Current Password</label>
            <input className={inputCls} type="password" placeholder="••••••••" />
          </div>
          <div>
            <label className={labelCls}>New Password</label>
            <input className={inputCls} type="password" placeholder="Min. 8 characters" />
          </div>
          <div>
            <label className={labelCls}>Confirm New Password</label>
            <input className={inputCls} type="password" placeholder="••••••••" />
          </div>
          <button className="self-start h-10 px-6 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors">
            Update Password
          </button>
        </div>
      </section>
    </div>
  );
}
