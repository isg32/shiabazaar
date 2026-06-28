"use client";
import { usePathname } from "next/navigation";
export function NavOffset() {
  return usePathname() === "/" ? null : <div className="h-16" />;
}
