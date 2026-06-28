"use client";

import { useRef, useEffect, useState } from "react";

export function ScrollBook() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0); // 0 = closed, 1 = fully open

  useEffect(() => {
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Open as element scrolls from entering viewport (bottom) to 30% from top
      const p = Math.max(0, Math.min(1, (vh - rect.top) / (vh * 0.7)));
      setProgress(p);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const coverAngle = progress * 162; // 0° closed → 162° fully open
  const tiltX = 12 - progress * 12;  // tilt down when closed, flatten as it opens
  const tiltY = -8 + progress * 8;   // slight Y angle when closed → straight when open
  const floatY = Math.sin(progress * Math.PI) * -10; // arc up during mid-open

  return (
    <div
      ref={ref}
      className="w-full h-full min-h-[280px] flex items-center justify-center"
      style={{ perspective: "1000px" }}
    >
      {/* Entire book group tilts as it opens */}
      <div
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(${floatY}px)`,
          position: "relative",
          width: "200px",
          height: "140px",
        }}
      >
        {/* ── Left page (always present, revealed as cover opens) ── */}
        <div style={{
          position: "absolute", left: 0, top: 0,
          width: "100px", height: "140px",
          background: "linear-gradient(95deg, #f2e8d5 0%, #ede0c4 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "inset 8px 0 16px rgba(0,0,0,0.12)",
        }}>
          <svg viewBox="0 0 70 100" width="52" height="74" fill="none">
            {/* Ruled lines */}
            {[14, 22, 30, 38, 46, 54, 62, 70, 78, 86].map((y) => (
              <line key={y} x1="8" y1={y} x2="62" y2={y} stroke="rgba(120,85,35,0.18)" strokeWidth="0.6" />
            ))}
            {/* Central medallion */}
            <rect x="18" y="28" width="34" height="34" stroke="rgba(180,130,40,0.5)" strokeWidth="0.8" />
            <rect x="18" y="28" width="34" height="34" stroke="rgba(180,130,40,0.5)" strokeWidth="0.8" transform="rotate(45 35 45)" />
            <circle cx="35" cy="45" r="7" stroke="rgba(180,130,40,0.55)" strokeWidth="0.8" fill="none" />
            {/* Page border */}
            <rect x="4" y="4" width="62" height="92" stroke="rgba(120,85,35,0.3)" strokeWidth="0.6" />
          </svg>
        </div>

        {/* ── Right page (always present) ── */}
        <div style={{
          position: "absolute", left: "100px", top: 0,
          width: "100px", height: "140px",
          background: "linear-gradient(85deg, #ede0c4 0%, #f2e8d5 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "inset -8px 0 16px rgba(0,0,0,0.08)",
        }}>
          <svg viewBox="0 0 70 100" width="52" height="74" fill="none">
            {[14, 22, 30, 38, 46, 54, 62, 70, 78, 86].map((y) => (
              <line key={y} x1="8" y1={y} x2="62" y2={y} stroke="rgba(120,85,35,0.18)" strokeWidth="0.6" />
            ))}
            {/* Corner ornaments */}
            <path d="M8 8 L18 8 L18 18" stroke="rgba(180,130,40,0.4)" strokeWidth="0.7" fill="none" />
            <path d="M62 8 L52 8 L52 18" stroke="rgba(180,130,40,0.4)" strokeWidth="0.7" fill="none" />
            <path d="M8 92 L18 92 L18 82" stroke="rgba(180,130,40,0.4)" strokeWidth="0.7" fill="none" />
            <path d="M62 92 L52 92 L52 82" stroke="rgba(180,130,40,0.4)" strokeWidth="0.7" fill="none" />
            <rect x="4" y="4" width="62" height="92" stroke="rgba(120,85,35,0.3)" strokeWidth="0.6" />
            {/* Page number */}
            <text x="35" y="96" textAnchor="middle" fontSize="6" fill="rgba(120,85,35,0.5)" fontFamily="serif">٢</text>
          </svg>
        </div>

        {/* ── Spine ── */}
        <div style={{
          position: "absolute", left: "97px", top: 0,
          width: "6px", height: "140px",
          background: "linear-gradient(90deg, #1c0b04, #5c3517, #1c0b04)",
          zIndex: 20,
        }} />

        {/* ── Front cover — rotates open on scroll ── */}
        <div
          style={{
            position: "absolute", left: "100px", top: 0,
            width: "100px", height: "140px",
            transformOrigin: "left center",
            transform: `rotateY(-${coverAngle}deg)`,
            transformStyle: "preserve-3d",
            zIndex: coverAngle < 88 ? 15 : 2,
          }}
        >
          {/* Outer face (leather cover, visible when closed) */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(150deg, #6b3b1e 0%, #2d1508 100%)",
            backfaceVisibility: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            <div style={{ position: "absolute", inset: "5px", border: "1px solid rgba(201,162,39,0.55)" }} />
            <svg viewBox="0 0 60 80" width="38" height="52" fill="none">
              <rect x="10" y="10" width="40" height="40" stroke="rgba(201,162,39,0.65)" strokeWidth="0.9" />
              <rect x="10" y="10" width="40" height="40" stroke="rgba(201,162,39,0.65)" strokeWidth="0.9" transform="rotate(45 30 30)" />
              <circle cx="30" cy="30" r="6"  stroke="rgba(201,162,39,0.72)" strokeWidth="0.9" fill="none" />
              <circle cx="30" cy="30" r="15" stroke="rgba(201,162,39,0.28)" strokeWidth="0.5" strokeDasharray="2.5 2.5" fill="none" />
            </svg>
            {/* Left-edge shadow */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.4) 0%, transparent 25%)" }} />
          </div>

          {/* Inner face (inside of cover, cream, visible when open and rotated past 90°) */}
          <div style={{
            position: "absolute", inset: 0,
            background: "#e8dcc8",
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
          }} />

          {/* Cover depth (right edge visible when closed at angle) */}
          <div style={{
            position: "absolute", width: "14px", height: "140px",
            right: "-14px", top: 0,
            transformOrigin: "left center",
            transform: "rotateY(90deg)",
            background: "linear-gradient(90deg, #ede5d6, #c8bfaf)",
          }} />
        </div>

        {/* ── Book thickness — bottom edge ── */}
        <div style={{
          position: "absolute", width: "200px", height: "14px",
          bottom: "-14px", left: 0,
          transformOrigin: "top center",
          transform: "rotateX(-90deg)",
          background: "linear-gradient(180deg, #c8bfaf, #ede5d6)",
        }} />
      </div>
    </div>
  );
}
