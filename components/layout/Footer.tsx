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
    { label: "About Us", href: "/about" },
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
    <footer className="bg-surface-dark text-on-dark-soft mt-auto">
      <div className="max-w-[1200px] mx-auto px-6 py-16">

        {/* Top row */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-12">
          {/* Brand */}
          <div className="shrink-0 lg:w-56">
            <Link
              href="/"
              className="text-on-dark font-display text-2xl font-normal tracking-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Shia Bazaar
            </Link>
            <p className="mt-3 text-sm text-on-dark-soft leading-relaxed max-w-xs">
              A curated collection of Islamic books, meaningful gifts, and everyday essentials.
            </p>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 flex-1">
            {Object.entries(footerLinks).map(([group, links]) => (
              <div key={group}>
                <p className="text-xs font-medium uppercase tracking-[1.5px] text-on-dark mb-4">
                  {group}
                </p>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-on-dark-soft hover:text-on-dark transition-colors"
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

        {/* Divider */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3 text-xs text-on-dark-soft">
          <p>© {new Date().getFullYear()} Shia Bazaar. All rights reserved.</p>
          <p>Made with care for the community.</p>
        </div>
      </div>
    </footer>
  );
}
