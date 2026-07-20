"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, Heart, User, Search, Menu, X, LogOut, Package, Heart as HeartIcon, LayoutDashboard, ChevronDown } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { useCart } from "@/context/CartContext";
import { buildCategoryTree, type CategoryNode } from "@/lib/category-tree";

type NavCategory = { id: string; name: string; slug: string; group: string; parentId: string | null };
type ExtraLink = { label: string; href: string };

// group = null → flat link, no dropdown
const navLinks = [
  { label: "Books",         href: "/category/books",         group: "book" },
  { label: "Gifts",         href: "/category/gifts",         group: "gift" },
  { label: "Other Products",href: "/category/other-products",group: "other" },
];

// Extra flat links folded into a group's dropdown alongside the category tree.
const groupExtraLinks: Record<string, ExtraLink[]> = {
  book: [
    { label: "Tazeem Publication", href: "/category/tazeem-publication" },
    { label: "Other Publications", href: "/category/other-publications" },
  ],
};

// Desktop mega menu — one column per top-level category, full subtree listed
// statically underneath (no nested hover flyouts). Panel spans the full nav width.
function MegaMenuTree({ node, depth }: { node: CategoryNode; depth: number }) {
  return (
    <>
      <Link href={`/category/${node.slug}`} style={{ paddingLeft: depth * 12 }}
        className="block py-1 text-sm text-body hover:text-primary transition-colors truncate">
        {node.name}
      </Link>
      {node.children.map(child => (
        <MegaMenuTree key={child.id} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

function MegaMenuColumn({ title, href, children }: { title: string; href?: string; children?: ReactNode }) {
  return (
    <div className="min-w-0">
      {href ? (
        <Link href={href} className="block text-sm font-semibold text-ink hover:text-primary transition-colors mb-2 truncate">
          {title}
        </Link>
      ) : (
        <p className="text-sm font-semibold text-ink mb-2 truncate">{title}</p>
      )}
      {children && <div className="flex flex-col">{children}</div>}
    </div>
  );
}

function MegaMenu({ group, categories, extraLinks }: {
  group: string; categories: NavCategory[]; extraLinks?: ExtraLink[];
}) {
  const tree = buildCategoryTree(categories, group);
  if (tree.length === 0 && !extraLinks?.length) return null;

  return (
    <div className="w-full bg-canvas border-b border-hairline shadow-[0_8px_24px_rgba(20,20,19,0.08)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 max-h-[70vh] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-6">
        {tree.map(node => (
          <MegaMenuColumn key={node.id} title={node.name} href={`/category/${node.slug}`}>
            {node.children.length > 0 &&
              node.children.map(child => <MegaMenuTree key={child.id} node={child} depth={0} />)}
          </MegaMenuColumn>
        ))}
        {extraLinks && extraLinks.length > 0 && (
          <MegaMenuColumn title="Publications">
            {extraLinks.map(link => (
              <Link key={link.href} href={link.href}
                className="block py-1 text-sm text-body hover:text-primary transition-colors truncate">
                {link.label}
              </Link>
            ))}
          </MegaMenuColumn>
        )}
      </div>
    </div>
  );
}

// Mobile — recursive accordion. Each node with children gets its own expand/collapse,
// indented one step further than its parent.
function MobileCategoryNode({ node, depth, onNavigate }: {
  node: CategoryNode; depth: number; onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const indent = 16 * depth;

  if (node.children.length === 0) {
    return (
      <Link href={`/category/${node.slug}`} style={{ paddingLeft: indent }}
        className="block py-2 text-sm text-body" onClick={onNavigate}>
        {node.name}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        style={{ paddingLeft: indent }}
        className="w-full flex items-center justify-between pr-2 py-2 text-sm text-body"
      >
        {node.name}
        <ChevronDown size={14} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="flex flex-col gap-0.5">
          <Link href={`/category/${node.slug}`} style={{ paddingLeft: indent + 16 }}
            className="py-2 text-sm font-medium text-primary" onClick={onNavigate}>
            All {node.name}
          </Link>
          {node.children.map(child => (
            <MobileCategoryNode key={child.id} node={child} depth={depth + 1} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
}

function MobileNavAccordionItem({ label, href, group, categories, extraLinks, onNavigate }: {
  label: string; href: string; group: string; categories: NavCategory[]; extraLinks?: ExtraLink[]; onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const tree = buildCategoryTree(categories, group);

  if (tree.length === 0 && !extraLinks?.length) {
    return (
      <Link href={href} className="py-3 text-lg font-medium text-ink border-b border-hairline" onClick={onNavigate}>
        {label}
      </Link>
    );
  }

  return (
    <div className="border-b border-hairline">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between py-3 text-lg font-medium text-ink"
      >
        {label}
        <ChevronDown size={18} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="pb-3 pl-4 flex flex-col gap-0.5">
          <Link href={href} className="py-2 text-sm font-medium text-primary" onClick={onNavigate}>
            All {label}
          </Link>
          {tree.map(node => (
            <MobileCategoryNode key={node.id} node={node} depth={1} onNavigate={onNavigate} />
          ))}
          {extraLinks?.map(link => (
            <Link key={link.href} href={link.href} style={{ paddingLeft: 16 }}
              className="block py-2 text-sm text-body" onClick={onNavigate}>
              {link.label}
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
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const megaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const user = session.data?.user;

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setNavCategories(d.categories ?? [])).catch(() => {});
  }, []);

  const close = () => { setMenuOpen(false); onClose?.(); };

  function openGroup(group: string) {
    if (megaTimeoutRef.current) clearTimeout(megaTimeoutRef.current);
    setHoveredGroup(group);
  }
  function closeGroupDelayed() {
    megaTimeoutRef.current = setTimeout(() => setHoveredGroup(null), 150);
  }

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
              <div key={link.href} onMouseEnter={() => openGroup(link.group)} onMouseLeave={closeGroupDelayed}>
                <Link href={link.href}
                  className="px-3 py-2 text-sm font-medium text-muted hover:text-ink whitespace-nowrap transition-colors rounded-md hover:bg-surface-soft flex items-center gap-1">
                  {link.label}
                  <ChevronDown size={12} className="opacity-50" />
                </Link>
              </div>
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

      {/* Desktop mega menu — full-width panel, spans the whole header */}
      {hoveredGroup && (
        <div
          className="hidden lg:block absolute top-full left-0 w-full z-50"
          onMouseEnter={() => openGroup(hoveredGroup)}
          onMouseLeave={closeGroupDelayed}
        >
          <MegaMenu group={hoveredGroup} categories={navCategories} extraLinks={groupExtraLinks[hoveredGroup]} />
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 flex flex-col px-6 py-8 gap-2" style={{ top: "64px", backgroundColor: "#faf9f5" }}>
          {navLinks.map((link) =>
            link.group ? (
              <MobileNavAccordionItem
                key={link.href}
                label={link.label}
                href={link.href}
                group={link.group}
                categories={navCategories}
                extraLinks={groupExtraLinks[link.group]}
                onNavigate={close}
              />
            ) : (
              <Link key={link.href} href={link.href}
                className="py-3 text-lg font-medium text-ink border-b border-hairline"
                onClick={close}>
                {link.label}
              </Link>
            )
          )}
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
