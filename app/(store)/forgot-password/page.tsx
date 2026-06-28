import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reset Password" };

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="bg-surface-card rounded-xl p-8 border border-hairline">
          <div className="text-center mb-8">
            <h1 className="display-sm text-ink">Reset password</h1>
            <p className="text-muted text-sm mt-2">
              Enter your email and we&apos;ll send a reset link (coming soon — email integration pending).
            </p>
          </div>
          <form className="flex flex-col gap-5">
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wide block mb-1.5">Email</label>
              <input
                type="email"
                placeholder="ali@example.com"
                className="w-full h-10 px-3 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full h-11 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors"
            >
              Send Reset Link
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-muted">
            <Link href="/login" className="text-primary hover:text-primary-active font-medium">← Back to Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
