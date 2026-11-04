"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

interface Zone {
  id: string;
  zone: string;
  label: string;
  price: number; // paise
}

const ZONE_DESC: Record<string, string> = {
  A: "Same city — Lucknow pincodes",
  B: "Same state — rest of Uttar Pradesh",
  C: "J&K, Ladakh & all North East states",
  D: "All other states and union territories",
};

export default function ShippingPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/shipping")
      .then((r) => r.json())
      .then((data: Zone[]) => {
        setZones(data);
        const init: Record<string, string> = {};
        data.forEach((z) => { init[z.zone] = String(z.price / 100); });
        setPrices(init);
      });
  }, []);

  async function save() {
    setSaving(true);
    const body = zones.map((z) => ({
      zone: z.zone,
      price: Math.round((parseFloat(prices[z.zone] ?? "0") || 0) * 100),
    }));
    await fetch("/api/admin/shipping", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-on-dark">Shipping Zones</h1>
        <p className="text-sm text-on-dark-soft mt-1">
          Flat shipping fee per zone. Set ₹0 for free shipping.
        </p>
      </div>

      <div className="space-y-3">
        {zones.map((z) => (
          <div
            key={z.zone}
            className="bg-surface-dark-elevated rounded-lg p-5 flex items-center gap-4"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-semibold shrink-0">
              {z.zone}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-on-dark">{z.label}</p>
              <p className="text-xs text-on-dark-soft mt-0.5">{ZONE_DESC[z.zone]}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-sm text-on-dark-soft">₹</span>
              <input
                type="number"
                min="0"
                step="1"
                value={prices[z.zone] ?? ""}
                onChange={(e) => setPrices((p) => ({ ...p, [z.zone]: e.target.value }))}
                className="w-24 h-9 px-3 text-sm text-right bg-surface-dark border border-white/10 rounded-md text-on-dark focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="mt-6 flex items-center gap-2 h-10 px-5 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors disabled:opacity-60"
      >
        <Save size={14} />
        {saved ? "Saved!" : saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );
}
