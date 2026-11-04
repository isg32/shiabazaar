"use client";

import { useState } from "react";
import { MapPin, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Result =
  | { ok: true; zone: string; label: string; price: number; district: string; state: string }
  | { ok: false; error: string };

export function PincodeChecker() {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function check() {
    const pin = value.trim();
    if (!/^[1-9]\d{5}$/.test(pin)) {
      setResult({ ok: false, error: "Please enter a valid 6-digit pincode." });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/shipping/check?pincode=${pin}`);
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, error: data.error ?? "Could not check pincode." });
      } else {
        setResult({ ok: true, ...data });
      }
    } catch {
      setResult({ ok: false, error: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-3 border-t border-hairline">
      <div className="flex items-center gap-2 mb-2">
        <MapPin size={13} className="text-muted" />
        <span className="text-xs font-medium text-muted">Check delivery to your area</span>
      </div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => { setValue(e.target.value); setResult(null); }}
          onKeyDown={(e) => e.key === "Enter" && check()}
          placeholder="Enter pincode…"
          maxLength={6}
          inputMode="numeric"
          className="h-9 flex-1 min-w-0 px-3 text-sm border border-hairline rounded-md bg-canvas placeholder:text-muted-soft focus:outline-none focus:border-primary"
        />
        <button
          onClick={check}
          disabled={loading}
          className="h-9 px-4 text-sm font-medium bg-primary text-on-primary rounded-md hover:bg-primary-active transition-colors shrink-0 disabled:opacity-60 flex items-center gap-1.5"
        >
          {loading && <Loader2 size={12} className="animate-spin" />}
          Check
        </button>
      </div>
      {result?.ok && (
        <div className="mt-2 flex items-start gap-1.5">
          <CheckCircle2 size={13} className="text-success mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-success font-medium">
              Delivery available to {value.trim()}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {result.district}, {result.state} · Zone {result.zone} ·{" "}
              {result.price === 0 ? "Free shipping" : `₹${result.price / 100} shipping`}
            </p>
          </div>
        </div>
      )}
      {result && !result.ok && (
        <p className="mt-2 text-xs text-error flex items-center gap-1.5">
          <AlertCircle size={12} />
          {result.error}
        </p>
      )}
    </div>
  );
}
