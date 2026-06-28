import { LoginForm } from "@/components/shared/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sign In" };

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-[480px]">

        {/* Header */}
        <div className="text-center mb-10">
          <svg viewBox="0 0 100 100" className="w-10 h-10 mx-auto mb-6 text-accent-amber" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="25" y="25" width="50" height="50" />
            <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)" />
            <circle cx="50" cy="50" r="8" />
          </svg>
          <h1 className="display-sm text-ink mb-2">Welcome back</h1>
          <p className="text-sm text-muted">Sign in to your Shia Bazaar account</p>
        </div>

        {/* Card */}
        <div className="bg-surface-card border border-hairline rounded-xl px-10 py-10">
          <LoginForm />
        </div>

        <p className="text-center text-xs text-muted-soft mt-5">
          Secured by Firebase Authentication
        </p>

      </div>
    </div>
  );
}
