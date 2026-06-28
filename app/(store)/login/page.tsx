import Link from "next/link";
import { Lock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-surface-card rounded-xl p-8 border border-hairline">
          <div className="text-center mb-8">
            <h1 className="display-sm text-ink">Welcome back</h1>
            <p className="text-muted text-sm mt-2">Sign in to your Shia Bazaar account</p>
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
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-medium text-muted uppercase tracking-wide">Password</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:text-primary-active">Forgot password?</Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full h-10 px-3 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors flex items-center justify-center gap-2"
            >
              <Lock size={14} /> Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:text-primary-active font-medium">
              Create one
            </Link>
          </div>
        </div>

        {/* Security note */}
        <p className="text-center text-xs text-muted mt-4 flex items-center justify-center gap-1">
          <Lock size={11} /> Secured by Firebase Authentication
        </p>
      </div>
    </div>
  );
}
