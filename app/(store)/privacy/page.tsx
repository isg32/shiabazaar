import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="max-w-[800px] mx-auto px-6 py-16">
      <h1 className="display-lg text-ink mb-3">Privacy Policy</h1>
      <p className="text-muted text-sm mb-10">Last updated: 28 June 2025</p>
      <div className="geometric-divider mb-10" />
      <div className="space-y-8 text-body text-sm leading-relaxed">
        {[
          ["What we collect", "We collect your name, email, phone number, and delivery address when you place an order or create an account. We also collect usage data (pages visited, device type) to improve the store."],
          ["How we use it", "Your data is used solely to process orders, send order updates, and improve your experience. We do not sell your data to third parties."],
          ["Authentication", "Account authentication is handled by Firebase Authentication (Google). Your password is never stored on our servers."],
          ["Payments", "Payment processing is handled by Razorpay. We never store card numbers or CVVs. Razorpay is PCI-DSS compliant."],
          ["Cookies", "We use essential cookies for session management and optional analytics cookies (e.g. Google Analytics). You can opt out of analytics via your browser settings."],
          ["Your rights", "You may request access to, correction of, or deletion of your personal data by contacting us at hello@shiabazaar.com."],
          ["Changes", "We may update this policy from time to time. Changes will be posted on this page with an updated date."],
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
