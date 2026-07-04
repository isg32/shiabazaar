"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ShoppingCart, Heart, User, Search, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Tazeem Publication", href: "/category/tazeem-publication" },
  { label: "Other Publications", href: "/category/other-publications" },
  { label: "Books", href: "/category/books" },
  { label: "Gifts", href: "/category/gifts" },
  { label: "Other Products", href: "/category/other-products" },
];

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [revealed, setRevealed] = useState(!isHome);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setRevealed(true);
      return;
    }
    setRevealed(false);
    const check = () => {
      const el = document.getElementById("brand-header");
      setRevealed(!el || window.scrollY > el.offsetHeight * 0.6);
    };
    window.addEventListener("scroll", check, { passive: true });
    check();
    return () => window.removeEventListener("scroll", check);
  }, [isHome]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 h-16 bg-canvas border-b border-hairline transition-transform duration-300 ${
          revealed ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between gap-4">

          {/* Logo + Wordmark */}
          <Link href="/" className="flex items-center gap-2.5 text-ink shrink-0">
            <svg viewBox="0 0 100 100" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="25" y="25" width="50" height="50" />
              <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)" />
              <circle cx="50" cy="50" r="8" />
            </svg>
            <div className="flex flex-col leading-none">
              <span className="text-[22px] font-normal tracking-tight leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                Shia Bazaar
              </span>
              <span className="text-[7.5px] font-medium tracking-[0.22em] text-accent-amber uppercase mt-0.5">
                Tanzeemul Makatib
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-muted hover:text-ink whitespace-nowrap transition-colors rounded-md hover:bg-surface-soft"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-0.5">
            <Link href="/search" aria-label="Search" className="w-10 h-10 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-surface-soft transition-colors">
              <Search size={18} />
            </Link>
            <Link href="/account/wishlist" aria-label="Wishlist" className="w-10 h-10 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-surface-soft transition-colors">
              <Heart size={18} />
            </Link>
            <Link href="/cart" aria-label="Cart" className="relative w-10 h-10 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-surface-soft transition-colors">
              <ShoppingCart size={18} />
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-on-primary text-[10px] font-medium rounded-full flex items-center justify-center leading-none">
                0
              </span>
            </Link>
            <Link href="/login" aria-label="Account" className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full text-muted hover:text-ink hover:bg-surface-soft transition-colors">
              <User size={18} />
            </Link>

            <button
              className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-surface-soft transition-colors"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — sibling to header so it has its own stacking context */}
      {menuOpen && (
        <div
          className="lg:hidden fixed inset-x-0 bottom-0 z-40 flex flex-col px-6 py-8 gap-2"
          style={{ top: "64px", backgroundColor: "#faf9f5" }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-3 text-lg font-medium text-ink border-b border-hairline"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="mt-4 py-3 text-lg font-medium text-primary"
            onClick={() => setMenuOpen(false)}
          >
            Sign In
          </Link>
        </div>
      )}
    </>
  );
}
