import Link from "next/link";
import { Lock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="bg-surface-card rounded-xl p-8 border border-hairline">
          <div className="text-center mb-8">
            <h1 className="display-sm text-ink">Create account</h1>
            <p className="text-muted text-sm mt-2">Join Shia Bazaar to track orders and save your wishlist</p>
          </div>

          <form className="flex flex-col gap-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted uppercase tracking-wide block mb-1.5">First Name</label>
                <input
                  type="text"
                  placeholder="Ali"
                  className="w-full h-10 px-3 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted uppercase tracking-wide block mb-1.5">Last Name</label>
                <input
                  type="text"
                  placeholder="Hussain"
                  className="w-full h-10 px-3 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wide block mb-1.5">Email</label>
              <input
                type="email"
                placeholder="ali@example.com"
                className="w-full h-10 px-3 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wide block mb-1.5">Password</label>
              <input
                type="password"
                placeholder="Min. 8 characters"
                className="w-full h-10 px-3 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wide block mb-1.5">Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full h-10 px-3 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-muted cursor-pointer">
              <input type="checkbox" className="mt-0.5 accent-[var(--color-primary)] w-3.5 h-3.5 shrink-0" />
              I agree to the{" "}
              <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </label>

            <button
              type="submit"
              className="w-full h-11 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors"
            >
              Create Account
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:text-primary-active font-medium">Sign in</Link>
          </div>
        </div>
        <p className="text-center text-xs text-muted mt-4 flex items-center justify-center gap-1">
          <Lock size={11} /> Secured by Firebase Authentication
        </p>
      </div>
    </div>
  );
}
