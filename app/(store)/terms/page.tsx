import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="max-w-[800px] mx-auto px-6 py-16">
      <h1 className="display-lg text-ink mb-3">Terms of Service</h1>
      <p className="text-muted text-sm mb-10">Last updated: 28 June 2025</p>
      <div className="geometric-divider mb-10" />
      <div className="space-y-8 text-body text-sm leading-relaxed">
        {[
          ["Acceptance", "By using Shia Bazaar, you agree to these terms. If you do not agree, please do not use the site."],
          ["Products & Pricing", "All prices are in Indian Rupees (₹) and inclusive of applicable taxes. We reserve the right to change prices at any time."],
          ["Orders", "Placing an order constitutes an offer to purchase. We reserve the right to cancel any order for any reason, including suspected fraud or stock unavailability."],
          ["Payments", "Payments are processed securely by Razorpay. By completing a purchase, you agree to Razorpay's terms of service."],
          ["Shipping", "We ship across India. Delivery times are estimates and not guaranteed. We are not responsible for delays caused by couriers or customs."],
          ["Returns", "Please review our Returns & Refunds policy. Returns must be raised within 7 days of delivery."],
          ["Intellectual Property", "All content on this site — text, images, design — is owned by Shia Bazaar or its suppliers and may not be reproduced without permission."],
          ["Limitation of Liability", "Shia Bazaar is not liable for any indirect, incidental, or consequential damages arising from the use of this site or products purchased."],
          ["Governing Law", "These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Mumbai."],
        ].map(([title, body]) => (
          <div key={title as string}>
            <h2 className="text-base font-medium text-ink mb-2">{title}</h2>
            <p>{body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
