"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, Heart, User, Search, Menu, X } from "lucide-react";

const navLinks = [
  { label: "Shop", href: "/products" },
  { label: "Books", href: "/category/books" },
  { label: "Gifts", href: "/category/gifts" },
  { label: "Ladies", href: "/category/ladies" },
  { label: "Gents", href: "/category/gents" },
  { label: "About", href: "/about" },
];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 h-16 bg-canvas border-b border-hairline">
      <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between gap-4">

        {/* Wordmark */}
        <Link
          href="/"
          className="text-ink font-display text-2xl font-normal tracking-tight shrink-0"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Shia Bazaar
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm font-medium text-muted hover:text-ink transition-colors rounded-md"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-1">
          <Link
            href="/search"
            aria-label="Search"
            className="w-10 h-10 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-surface-card transition-colors"
          >
            <Search size={18} />
          </Link>
          <Link
            href="/account/wishlist"
            aria-label="Wishlist"
            className="w-10 h-10 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-surface-card transition-colors"
          >
            <Heart size={18} />
          </Link>
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative w-10 h-10 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-surface-card transition-colors"
          >
            <ShoppingCart size={18} />
            {/* ponytail: static badge count — will be dynamic in Phase 3 */}
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-on-primary text-[10px] font-medium rounded-full flex items-center justify-center leading-none">
              0
            </span>
          </Link>
          <Link
            href="/login"
            aria-label="Account"
            className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full text-muted hover:text-ink hover:bg-surface-card transition-colors"
          >
            <User size={18} />
          </Link>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-surface-card transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu — full-screen cream sheet */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-canvas z-40 flex flex-col px-6 py-8 gap-2">
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
    </header>
  );
}
