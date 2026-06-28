import { Mail, MapPin, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  const inputCls = "w-full h-10 px-3 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors";
  const labelCls = "text-xs font-medium text-muted uppercase tracking-wide block mb-1.5";

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-16">
      <h1 className="display-lg text-ink mb-3">Contact Us</h1>
      <p className="text-muted mb-12 max-w-md">Have a question, feedback, or need help with an order? We&apos;re here.</p>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Form */}
        <form className="flex flex-col gap-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Name</label>
              <input className={inputCls} placeholder="Ali Hussain" />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input className={inputCls} type="email" placeholder="ali@example.com" />
            </div>
          </div>
          <div>
            <label className={labelCls}>Subject</label>
            <input className={inputCls} placeholder="Order issue, product query..." />
          </div>
          <div>
            <label className={labelCls}>Message</label>
            <textarea
              rows={5}
              placeholder="Tell us how we can help..."
              className="w-full px-3 py-2.5 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors resize-none"
            />
          </div>
          <button
            type="submit"
            className="self-start h-11 px-8 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors"
          >
            Send Message
          </button>
        </form>

        {/* Info */}
        <div className="flex flex-col gap-6">
          {[
            { icon: Mail,    title: "Email",         value: "hello@shiabazaar.com" },
            { icon: Clock,   title: "Response time", value: "We reply within 24 hours on business days" },
            { icon: MapPin,  title: "Based in",      value: "Mumbai, Maharashtra, India" },
          ].map(({ icon: Icon, title, value }) => (
            <div key={title} className="flex gap-4 p-5 bg-surface-card rounded-xl border border-hairline">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <Icon size={16} />
              </div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wide mb-1">{title}</p>
                <p className="text-sm font-medium text-ink">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
