"use client";

import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div
      key={pathname}
      style={{ animation: "sb-fade-in 0.4s ease both" }}
    >
      {children}
    </div>
  );
}
