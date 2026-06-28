"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, Heart, User, Search, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Tazeem Publication", href: "/category/tazeem-publication" },
  { label: "Other Publications", href: "/category/other-publications" },
  { label: "Books", href: "/category/books" },
  { label: "Gifts", href: "/category/gifts" },
  { label: "Other Products", href: "/category/other-products" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 h-16 bg-surface-dark border-b border-white/10">
      <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between gap-4">

        {/* Logo + Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-on-dark shrink-0"
        >
          <svg viewBox="0 0 100 100" className="w-7 h-7 text-on-dark" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="25" y="25" width="50" height="50" />
            <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)" />
            <circle cx="50" cy="50" r="8" />
          </svg>
          <span
            className="text-2xl font-normal tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Shia Bazaar
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm font-medium text-on-dark-soft hover:text-on-dark whitespace-nowrap transition-colors rounded-md hover:bg-white/8"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-0.5">
          <Link href="/search" aria-label="Search" className="w-10 h-10 flex items-center justify-center rounded-full text-on-dark-soft hover:text-on-dark hover:bg-white/8 transition-colors">
            <Search size={18} />
          </Link>
          <Link href="/account/wishlist" aria-label="Wishlist" className="w-10 h-10 flex items-center justify-center rounded-full text-on-dark-soft hover:text-on-dark hover:bg-white/8 transition-colors">
            <Heart size={18} />
          </Link>
          <Link href="/cart" aria-label="Cart" className="relative w-10 h-10 flex items-center justify-center rounded-full text-on-dark-soft hover:text-on-dark hover:bg-white/8 transition-colors">
            <ShoppingCart size={18} />
            {/* ponytail: static badge — dynamic in Phase 3 */}
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-on-primary text-[10px] font-medium rounded-full flex items-center justify-center leading-none">
              0
            </span>
          </Link>
          <Link href="/login" aria-label="Account" className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full text-on-dark-soft hover:text-on-dark hover:bg-white/8 transition-colors">
            <User size={18} />
          </Link>

          {/* Hamburger — mobile/tablet only */}
          <button
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full text-on-dark-soft hover:text-on-dark hover:bg-white/8 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu — full-screen dark sheet */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-surface-dark z-40 flex flex-col px-6 py-8 gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-3 text-lg font-medium text-on-dark border-b border-white/10"
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
    </header>
  );
}
