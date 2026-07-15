"use client";

import { useState } from "react";
import { MapPin, CheckCircle2 } from "lucide-react";

export function PincodeChecker() {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "invalid">("idle");

  function check() {
    if (/^[1-9]\d{5}$/.test(value.trim())) {
      setStatus("ok");
    } else {
      setStatus("invalid");
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
          onChange={(e) => { setValue(e.target.value); setStatus("idle"); }}
          onKeyDown={(e) => e.key === "Enter" && check()}
          placeholder="Enter pincode…"
          maxLength={6}
          inputMode="numeric"
          className="h-9 flex-1 min-w-0 px-3 text-sm border border-hairline rounded-md bg-canvas placeholder:text-muted-soft focus:outline-none focus:border-primary"
        />
        <button
          onClick={check}
          className="h-9 px-4 text-sm font-medium bg-primary text-on-primary rounded-md hover:bg-primary-active transition-colors shrink-0"
        >
          Check
        </button>
      </div>
      {status === "ok" && (
        <p className="mt-2 text-xs text-success flex items-center gap-1.5">
          <CheckCircle2 size={12} /> Delivery available to {value.trim()}
        </p>
      )}
      {status === "invalid" && (
        <p className="mt-2 text-xs text-error">Please enter a valid 6-digit pincode.</p>
      )}
    </div>
  );
}
