import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "About Us — Shia Bazaar" };

export default function AboutPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-16">
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[1.5px] text-primary mb-4">Our Story</p>
        <h1 className="display-lg text-ink mb-6">About Shia Bazaar</h1>

        <div className="space-y-5 text-body leading-relaxed">
          <p>
            Shia Bazaar is a curated online store dedicated to the Shia Muslim community — bringing
            together authentic Islamic books, meaningful gifts, and everyday essentials under one roof.
          </p>
          <p>
            We are operated under <strong className="text-ink">Tanzeemul Makatib</strong>, with a
            mission to make quality Shia literature and religious goods accessible to everyone, whether
            you are looking for a scholarly text, a thoughtful gift, or something for daily use.
          </p>
          <p>
            Our catalogue spans Tazeem Publication titles, other respected publishers, ladies and gents
            collections, and a growing range of gifts — all carefully selected and packed with care.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-3 gap-6">
          {[
            { label: "Est.", value: "2024", sub: "Building since" },
            { label: "200+", value: "Titles", sub: "Across all categories" },
            { label: "India", value: "Wide", sub: "Shipping across the country" },
          ].map(({ label, value, sub }) => (
            <div key={label} className="bg-surface-card rounded-xl p-5">
              <p className="text-2xl font-semibold text-ink">{label}</p>
              <p className="text-sm font-medium text-ink mt-0.5">{value}</p>
              <p className="text-xs text-muted mt-1">{sub}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex gap-4">
          <Link href="/products" className="inline-flex h-10 px-6 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors items-center">
            Browse Products
          </Link>
          <Link href="/contact" className="inline-flex h-10 px-6 border border-hairline text-ink text-sm font-medium rounded-md hover:bg-surface-card transition-colors items-center">
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
