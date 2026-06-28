import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about Shia Bazaar — our mission, values, and the community we serve.",
};

export default function AboutPage() {
  return (
    <div className="max-w-[800px] mx-auto px-6 py-16">
      <h1 className="display-lg text-ink mb-6">About Shia Bazaar</h1>
      <div className="geometric-divider mb-10" />

      <div className="prose-custom space-y-6 text-body leading-relaxed">
        <p className="text-lg text-body-strong">
          Shia Bazaar was founded with one simple purpose — to make authentic
          Islamic literature, meaningful gifts, and community essentials
          accessible to every household.
        </p>
        <p>
          We believe that knowledge is light. Our curated collection of books
          spans Quran studies, tafsir, fiqh, history, duas, and more — all
          sourced from trusted publishers and verified for authenticity.
        </p>
        <p>
          Beyond books, we carry a range of gifts that reflect the values and
          aesthetics of the Shia tradition — from engraved night lamps and
          calligraphy mugs to photo frames that bring warmth to every home.
        </p>

        <div className="bg-surface-card rounded-xl p-8 border border-hairline my-8">
          <h2 className="text-lg font-medium text-ink mb-4">Our Values</h2>
          <ul className="space-y-3">
            {[
              ["Authenticity", "Every book is verified. Every product is tested before listing."],
              ["Community", "We are a store built by the community, for the community."],
              ["Accessibility", "Fair pricing and free shipping thresholds so knowledge reaches everyone."],
              ["Care", "Each order is packed carefully — especially books, which deserve it."],
            ].map(([title, desc]) => (
              <li key={title as string} className="flex gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <p className="font-medium text-ink">{title}</p>
                  <p className="text-sm text-muted mt-0.5">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-muted text-sm">
          Have questions or feedback? We&apos;d love to hear from you at{" "}
          <a href="mailto:hello@shiabazaar.com" className="text-primary hover:text-primary-active underline">
            hello@shiabazaar.com
          </a>
        </p>
      </div>
    </div>
  );
}
