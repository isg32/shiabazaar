import Link from "next/link";
import { Truck, ShieldCheck, Headphones } from "lucide-react";

const benefits = [
  {
    Icon: Truck,
    label: "Free International Shipping",
    desc: "On qualifying orders delivered across the globe",
  },
  {
    Icon: ShieldCheck,
    label: "All your purchases are protected",
    desc: "Secure checkout and a full buyer guarantee",
  },
  {
    Icon: Headphones,
    label: "Consultants will help any minute",
    desc: "Our team is available any time you need help",
  },
];

export function MembershipBar() {
  return (
    <section className="bg-surface-card border-y border-hairline">
      <div className="max-w-[1200px] mx-auto px-6 py-12 grid lg:grid-cols-2 gap-10 items-center">

        {/* Left — CTA */}
        <div>
          <p className="text-xs font-medium uppercase tracking-[1.5px] text-muted mb-3">
            Exclusive Access
          </p>
          <h2 className="display-sm text-ink mb-4">Become a Member</h2>
          <p className="text-sm text-body leading-relaxed mb-6 lg:w-80">
            Create a free account to access member-only deals, order history,
            wishlists, and personalised recommendations.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center h-10 px-6 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors"
          >
            Sign Up Free
          </Link>
        </div>

        {/* Right — Benefits */}
        <div>
          <p className="text-sm font-medium text-ink mb-6 leading-snug">
            Join us and discover a world of exclusive benefits today
          </p>
          <div className="flex flex-col gap-5">
            {benefits.map(({ Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                  <Icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">{label}</p>
                  <p className="text-xs text-body mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
