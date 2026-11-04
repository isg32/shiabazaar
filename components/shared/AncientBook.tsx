"use client";

export function AncientBook() {
  return (
    <div
      className="flex items-center justify-center w-full h-full min-h-[260px]"
      style={{ perspective: "900px" }}
    >
      <style>{`
        @keyframes ancient-float {
          0%,100% { transform: rotateX(10deg) rotateY(-30deg) translateY(0px); }
          50%      { transform: rotateX(10deg) rotateY(-4deg)  translateY(-14px); }
        }
        .ancient-book-anim { animation: ancient-float 7s ease-in-out infinite; }
      `}</style>

      <div className="ancient-book-anim" style={{ transformStyle: "preserve-3d" }}>
        {/* Book body — 100×140px, depth 20px (z=0 front → z=-20 back) */}
        <div style={{ width: "100px", height: "140px", position: "relative", transformStyle: "preserve-3d" }}>

          {/* ── Front cover ── */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(150deg, #6b3b1e 0%, #2d1508 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden",
          }}>
            {/* Inner gold border */}
            <div style={{ position: "absolute", inset: "5px", border: "1px solid rgba(201,162,39,0.55)" }} />
            {/* Persian star pattern */}
            <svg viewBox="0 0 60 60" width="38" height="38" fill="none">
              <rect x="12" y="12" width="36" height="36" stroke="rgba(201,162,39,0.65)" strokeWidth="0.9" />
              <rect x="12" y="12" width="36" height="36" stroke="rgba(201,162,39,0.65)" strokeWidth="0.9" transform="rotate(45 30 30)" />
              <circle cx="30" cy="30" r="6"  stroke="rgba(201,162,39,0.7)"  strokeWidth="0.9" fill="none" />
              <circle cx="30" cy="30" r="14" stroke="rgba(201,162,39,0.3)"  strokeWidth="0.5" strokeDasharray="2.5 2.5" fill="none" />
            </svg>
            {/* Spine-side shadow */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(0,0,0,0.45) 0%, transparent 30%)" }} />
          </div>

          {/* ── Spine — left face ── */}
          {/* left:-20px puts it to the left of the cover; rotateY(-90deg) around its right edge folds it in */}
          <div style={{
            position: "absolute", width: "20px", height: "140px", left: "-20px", top: 0,
            transformOrigin: "right center",
            transform: "rotateY(-90deg)",
            background: "linear-gradient(90deg, #0c0502 0%, #2e1608 100%)",
            borderTop: "1px solid rgba(201,162,39,0.18)",
            borderBottom: "1px solid rgba(201,162,39,0.18)",
          }} />

          {/* ── Pages — right edge ── */}
          <div style={{
            position: "absolute", width: "20px", height: "140px", right: "-20px", top: 0,
            transformOrigin: "left center",
            transform: "rotateY(90deg)",
            background: "linear-gradient(90deg, #ede5d6 0%, #c8bfaf 100%)",
          }} />

          {/* ── Pages — top edge ── */}
          <div style={{
            position: "absolute", width: "100px", height: "20px", top: "-20px", left: 0,
            transformOrigin: "bottom center",
            transform: "rotateX(90deg)",
            background: "linear-gradient(180deg, #b8b0a0 0%, #ede5d6 100%)",
          }} />

        </div>
      </div>
    </div>
  );
}
