"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, Heart, User, Search, Menu, X, LogOut, Package, Heart as HeartIcon, LayoutDashboard } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { useCart } from "@/context/CartContext";

type NavCategory = { id: string; name: string; slug: string; group: string };

// group = null → flat link, no dropdown
const navLinks = [
  { label: "Tazeem Publication", href: "/category/tazeem-publication", group: null },
  { label: "Other Publications", href: "/category/other-publications", group: null },
  { label: "Books",         href: "/category/books",         group: "book" },
  { label: "Gifts",         href: "/category/gifts",         group: "gift" },
  { label: "Other Products",href: "/category/other-products",group: "other" },
];

function NavDropdown({ label, href, group, categories }: {
  label: string; href: string; group: string; categories: NavCategory[];
}) {
  const [open, setOpen] = useState(false);
  const items = categories.filter(c => c.group === group);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onEnter() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (items.length) setOpen(true);
  }
  function onLeave() {
    timeoutRef.current = setTimeout(() => setOpen(false), 120);
  }

  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <Link href={href}
        className="px-3 py-2 text-sm font-medium text-muted hover:text-ink whitespace-nowrap transition-colors rounded-md hover:bg-surface-soft flex items-center gap-1">
        {label}
        {items.length > 0 && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="mt-px opacity-50">
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </Link>
      {open && items.length > 0 && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] bg-canvas border border-hairline rounded-xl shadow-[0_4px_20px_rgba(20,20,19,0.10)] py-1.5 overflow-hidden">
          {items.map(cat => (
            <Link key={cat.id} href={`/category/${cat.slug}`}
              className="block px-4 py-2 text-sm text-body hover:text-ink hover:bg-surface-soft transition-colors whitespace-nowrap">
              {cat.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function initials(name: string | null | undefined, email: string) {
  if (name?.trim()) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function UserMenu() {
  const router = useRouter();
  const session = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!session.data?.user) return;
    fetch("/api/auth/admin-status").then(r => r.json()).then(d => setIsAdmin(d.isAdmin ?? false));
  }, [session.data?.user]);

  if (session.isPending) return <div className="w-8 h-8 rounded-full bg-surface-soft animate-pulse" />;
  if (!session.data?.user) {
    return (
      <Link href="/auth/sign-in" aria-label="Sign in" className="hidden sm:flex w-10 h-10 items-center justify-center rounded-full text-muted hover:text-ink hover:bg-surface-soft transition-colors">
        <User size={18} />
      </Link>
    );
  }

  const user = session.data.user;
  const inits = initials(user.name, user.email);

  async function signOut() {
    await authClient.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Account menu"
        className="w-8 h-8 rounded-full bg-primary text-on-primary text-[12px] font-semibold flex items-center justify-center hover:bg-primary-active transition-colors select-none"
      >
        {inits}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-52 bg-canvas border border-hairline rounded-xl shadow-[0_4px_20px_rgba(20,20,19,0.10)] py-1.5 overflow-hidden">
          <div className="px-4 py-3 border-b border-hairline">
            <p className="text-[13px] font-medium text-ink truncate">{user.name || "Account"}</p>
            <p className="text-[11px] text-muted truncate mt-0.5">{user.email}</p>
          </div>
          <div className="py-1">
            <Link href="/account/orders" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-body hover:text-ink hover:bg-surface-soft transition-colors">
              <Package size={14} className="text-muted" /> Orders
            </Link>
            <Link href="/account/wishlist" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-body hover:text-ink hover:bg-surface-soft transition-colors">
              <HeartIcon size={14} className="text-muted" /> Wishlist
            </Link>
            {isAdmin && (
              <Link href="/admin" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-primary hover:text-primary-active hover:bg-surface-soft transition-colors">
                <LayoutDashboard size={14} /> Admin Panel
              </Link>
            )}
          </div>
          <div className="border-t border-hairline pt-1 pb-1">
            <button onClick={signOut}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-muted hover:text-error hover:bg-error/5 transition-colors">
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Shared inner nav — used by both fixed (layout) and sticky (homepage) versions
function NavInner({ onClose }: { onClose?: () => void }) {
  const router = useRouter();
  const session = authClient.useSession();
  const { count: cartCount } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [navCategories, setNavCategories] = useState<NavCategory[]>([]);
  const user = session.data?.user;

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setNavCategories(d.categories ?? [])).catch(() => {});
  }, []);

  const close = () => { setMenuOpen(false); onClose?.(); };

  return (
    <>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 text-ink shrink-0">
          <Image
            src="/logo-main.png"
            alt="Shia Bazaar"
            width={140}
            height={42}
            className="object-contain"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) =>
            link.group ? (
              <NavDropdown key={link.href} label={link.label} href={link.href} group={link.group} categories={navCategories} />
            ) : (
              <Link key={link.href} href={link.href}
                className="px-3 py-2 text-sm font-medium text-muted hover:text-ink whitespace-nowrap transition-colors rounded-md hover:bg-surface-soft">
                {link.label}
              </Link>
            )
          )}
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
            {cartCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-on-primary text-[10px] font-medium rounded-full flex items-center justify-center leading-none">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>
          <UserMenu />
          <button
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-surface-soft transition-colors"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 flex flex-col px-6 py-8 gap-2" style={{ top: "64px", backgroundColor: "#faf9f5" }}>
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className="py-3 text-lg font-medium text-ink border-b border-hairline"
              onClick={close}>
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link href="/account/orders" className="mt-4 py-3 text-lg font-medium text-ink border-b border-hairline" onClick={close}>Orders</Link>
              <Link href="/account/wishlist" className="py-3 text-lg font-medium text-ink border-b border-hairline" onClick={close}>Wishlist</Link>
              <button
                className="mt-4 py-3 text-left text-lg font-medium text-error"
                onClick={async () => { await authClient.signOut(); close(); router.push("/"); router.refresh(); }}
              >Sign out</button>
            </>
          ) : (
            <Link href="/auth/sign-in" className="mt-4 py-3 text-lg font-medium text-primary" onClick={close}>Sign In</Link>
          )}
        </div>
      )}
    </>
  );
}

// Layout version — fixed, only on non-homepage routes
export function Navbar() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-canvas border-b border-hairline">
      <NavInner />
    </header>
  );
}

// Homepage version — sticky, rendered inline after brand-header in page.tsx
export function HomepageNavbar() {
  return (
    <header className="sticky top-0 z-50 h-16 bg-canvas border-t border-b border-hairline">
      <NavInner />
    </header>
  );
}
