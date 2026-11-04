"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export function NavigationLoader() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const prevPath = useRef(pathname);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Navigation ended — pathname changed
  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;
    if (timer.current) clearTimeout(timer.current);
    setFadingOut(true);
    timer.current = setTimeout(() => {
      setVisible(false);
      setFadingOut(false);
    }, 320);
  }, [pathname]);

  useEffect(() => {
    function onLinkClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      // Skip: external, mailto, tel, hash-only, new-tab
      if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      if (anchor.target === "_blank") return;
      // Skip same-path hash navigation
      try {
        const target = new URL(href, window.location.href);
        if (target.pathname === pathname && target.hash) return;
      } catch { return; }

      if (timer.current) clearTimeout(timer.current);
      setFadingOut(false);
      setVisible(true);
    }
    document.addEventListener("click", onLinkClick);
    return () => document.removeEventListener("click", onLinkClick);
  }, [pathname]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        backgroundColor: "#faf9f5",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "36px",
        animation: fadingOut
          ? "sb-fade-out 0.32s ease both"
          : "sb-fade-in 0.22s ease both",
      }}
    >
      <Image
        src="/logo-main.png"
        alt="Shia Bazaar"
        width={200}
        height={70}
        priority
        style={{ opacity: 0.92 }}
      />
      <div
        style={{
          width: "28px",
          height: "28px",
          border: "2px solid #e6dfd8",
          borderTopColor: "#cc785c",
          borderRadius: "50%",
          animation: "sb-spin 0.7s linear infinite",
        }}
      />
    </div>
  );
}
