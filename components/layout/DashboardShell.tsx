"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; Icon: LucideIcon };
export type NavGroup = { label: string | null; items: NavItem[] };

type Props = {
  /** Nav groups rendered in the sidebar, in order. */
  groups: NavGroup[];
  /** Small uppercase badge under the wordmark, e.g. "Admin" or "Desk". */
  badge: string;
  /** Where the brand link points. */
  homeHref?: string;
  /** The section root href — matched exactly for the "active" state; every other item uses startsWith. */
  activeBase: string;
  onSignOut: () => void | Promise<void>;
  children: React.ReactNode;
};

/**
 * The shared dark dashboard chrome used by both `/admin` and `/desk`. Layout,
 * spacing and colours are identical across both — only `groups` / `badge` /
 * `activeBase` differ.
 */
export default function DashboardShell({
  groups,
  badge,
  homeHref = "/",
  activeBase,
  onSignOut,
  children,
}: Props) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-surface-dark">

      {/* ── Sidebar ── */}
      <aside className="w-56 shrink-0 flex flex-col bg-surface-dark border-r border-white/8">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/8">
          <Link href={homeHref} className="flex items-center gap-2.5 text-on-dark">
            <svg viewBox="0 0 100 100" className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="25" y="25" width="50" height="50" />
              <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)" />
              <circle cx="50" cy="50" r="8" />
            </svg>
            <div className="flex flex-col leading-none">
              <span className="text-[15px] font-normal tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                Shia Bazaar
              </span>
              <span className="text-[7px] font-medium tracking-[0.2em] text-accent-amber uppercase mt-0.5">
                {badge}
              </span>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-4 overflow-y-auto">
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="px-3 mb-1 text-[10px] font-semibold tracking-[0.18em] uppercase text-on-dark-soft/50">
                  {group.label}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {group.items.map(({ href, label, Icon }) => {
                  const active = href === activeBase ? pathname === activeBase : pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-on-dark-soft hover:text-on-dark hover:bg-surface-dark-elevated"
                      }`}
                    >
                      <Icon size={15} />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 py-4 border-t border-white/8">
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-on-dark-soft hover:text-error hover:bg-error/10 transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>

      </aside>

      {/* ── Main ── */}
      <main className="flex-1 min-w-0 overflow-auto bg-surface-dark-soft">
        {children}
      </main>

    </div>
  );
}
