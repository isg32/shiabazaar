"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

type Popup = {
  id: string;
  title: string;
  code: string | null;
  delayMs: number;
};

export function HomepagePopup({ popup }: { popup: Popup }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show again if dismissed this session
    if (sessionStorage.getItem(`popup_dismissed_${popup.id}`)) return;
    const t = setTimeout(() => setVisible(true), popup.delayMs);
    return () => clearTimeout(t);
  }, [popup.id, popup.delayMs]);

  function dismiss() {
    sessionStorage.setItem(`popup_dismissed_${popup.id}`, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={dismiss}>
      <div
        className="bg-canvas rounded-2xl p-8 max-w-[576px] w-full shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={dismiss} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-soft text-muted hover:text-ink transition-colors">
          <X size={16} />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-6 h-6 text-primary" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="25" y="25" width="50" height="50" />
              <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)" />
              <circle cx="50" cy="50" r="8" />
            </svg>
          </div>

          <h2 className="text-ink font-medium text-lg leading-snug">{popup.title}</h2>

          {popup.code && (
            <div className="w-full bg-surface-soft rounded-lg p-3 border border-hairline">
              <p className="text-xs text-muted mb-1">Use code at checkout</p>
              <p className="font-mono font-semibold text-primary text-lg tracking-widest">{popup.code}</p>
            </div>
          )}

          <button
            onClick={dismiss}
            className="w-full h-10 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors"
          >
            Shop Now
          </button>
        </div>
      </div>
    </div>
  );
}
