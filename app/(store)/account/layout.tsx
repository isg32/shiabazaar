import Link from "next/link";
import { ShoppingBag, User, Heart, Star, ChevronRight } from "lucide-react";
import { AccountUserStub } from "@/components/account/AccountUserStub";

const accountNav = [
  { href: "/account",          label: "Dashboard",  icon: User },
  { href: "/account/orders",   label: "My Orders",  icon: ShoppingBag },
  { href: "/account/wishlist", label: "Wishlist",   icon: Heart },
  { href: "/account/reviews",  label: "My Reviews", icon: Star },
  { href: "/account/profile",  label: "Profile",    icon: User },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-56 shrink-0">
          <div className="bg-surface-card rounded-xl overflow-hidden border border-hairline">
            <AccountUserStub />
            <nav className="py-2">
              {accountNav.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between px-5 py-3 text-sm text-muted hover:text-ink hover:bg-canvas transition-colors group"
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={15} />
                    {label}
                  </span>
                  <ChevronRight size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
