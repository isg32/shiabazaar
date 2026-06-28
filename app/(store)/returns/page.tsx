import type { Metadata } from "next";

export const metadata: Metadata = { title: "Returns & Refunds" };

const steps = [
  { step: "1", title: "Raise a request", desc: "Go to My Orders in your account dashboard and click 'Request Return' on the delivered order within 7 days." },
  { step: "2", title: "We review it",    desc: "Our team reviews the request within 1–2 business days and notifies you by email (coming soon)." },
  { step: "3", title: "Ship it back",    desc: "Once approved, ship the item back in its original packaging. We provide the return address." },
  { step: "4", title: "Refund issued",   desc: "Refund is processed to your original payment method within 5–7 business days after we receive the item." },
];

export default function ReturnsPage() {
  return (
    <div className="max-w-[800px] mx-auto px-6 py-16">
      <h1 className="display-lg text-ink mb-3">Returns & Refunds</h1>
      <p className="text-body mb-10 lg:w-80">We want you to be happy with every purchase. If something isn&apos;t right, here&apos;s how returns work.</p>

      <div className="geometric-divider mb-10" />

      {/* Steps */}
      <div className="flex flex-col gap-6 mb-12">
        {steps.map((s) => (
          <div key={s.step} className="flex gap-5">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-medium shrink-0">{s.step}</div>
            <div>
              <p className="font-medium text-ink">{s.title}</p>
              <p className="text-sm text-body mt-1 leading-relaxed lg:w-80">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Policy notes */}
      <div className="bg-surface-card rounded-xl p-6 border border-hairline space-y-4 text-sm text-body">
        <h2 className="text-base font-medium text-ink">Policy Details</h2>
        <ul className="space-y-2">
          {[
            "Returns accepted within 7 days of delivery.",
            "Items must be unused and in original packaging.",
            "Books with broken spines or missing pages are not eligible.",
            "Personalized or custom-engraved items cannot be returned.",
            "Shipping charges are non-refundable unless the error is ours.",
          ].map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-primary mt-0.5">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
