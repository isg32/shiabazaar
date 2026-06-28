import Link from "next/link";

const footerLinks = {
  Shop: [
    { label: "All Products", href: "/products" },
    { label: "Islamic Books", href: "/category/books" },
    { label: "Gifts", href: "/category/gifts" },
    { label: "Ladies", href: "/category/ladies" },
    { label: "Gents", href: "/category/gents" },
  ],
  Account: [
    { label: "My Orders", href: "/account/orders" },
    { label: "Wishlist", href: "/account/wishlist" },
    { label: "Profile", href: "/account/profile" },
    { label: "Sign In", href: "/login" },
  ],
  Info: [
    { label: "Contact", href: "/contact" },
    { label: "Returns", href: "/returns" },
    { label: "Track Order", href: "/account/orders" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-surface-soft border-t border-hairline mt-auto">
      <div className="max-w-[1200px] mx-auto px-6 py-16">

        {/* Top row */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-12">
          {/* Brand */}
          <div className="shrink-0 lg:w-80">
            <Link
              href="/"
              className="flex items-center gap-2 text-ink"
            >
              <svg viewBox="0 0 100 100" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="25" y="25" width="50" height="50" />
                <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)" />
                <circle cx="50" cy="50" r="8" />
              </svg>
              <span className="font-display text-2xl font-normal tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                Shia Bazaar
              </span>
            </Link>
            <p className="mt-3 text-sm text-body leading-relaxed">
              A curated collection of Shia Islamic books, meaningful gifts, and everyday essentials.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 flex-1">
            {Object.entries(footerLinks).map(([group, links]) => (
              <div key={group}>
                <p className="text-xs font-medium uppercase tracking-[1.5px] text-ink mb-4">
                  {group}
                </p>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted hover:text-ink transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-hairline flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted">
          <p>© {new Date().getFullYear()} Shia Bazaar. All rights reserved.</p>
          <p>Made with care for the community.</p>
        </div>
      </div>
    </footer>
  );
}
