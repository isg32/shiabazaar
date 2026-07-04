import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

type AuthPath = "sign-in" | "sign-up" | "forgot-password";

const META: Record<AuthPath, { title: string }> = {
  "sign-in":         { title: "Sign In" },
  "sign-up":         { title: "Create Account" },
  "forgot-password": { title: "Reset Password" },
};

export async function generateMetadata({ params }: { params: Promise<{ path: string }> }): Promise<Metadata> {
  const { path } = await params;
  return META[path as AuthPath] ? { title: META[path as AuthPath].title } : {};
}

export function generateStaticParams() {
  return Object.keys(META).map((path) => ({ path }));
}

const HEADINGS: Record<AuthPath, { heading: string; sub: string }> = {
  "sign-in":         { heading: "Welcome back",      sub: "Sign in to your Shia Bazaar account" },
  "sign-up":         { heading: "Create an account", sub: "Join Shia Bazaar today" },
  "forgot-password": { heading: "Reset your password", sub: "Enter your email and we'll send a reset link" },
};

export default async function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = await params;
  if (!META[path as AuthPath]) notFound();

  const view = path as AuthPath;
  const { heading, sub } = HEADINGS[view];

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-[420px]">

        {/* Brand mark */}
        <div className="flex flex-col items-center mb-10">
          <svg viewBox="0 0 100 100" className="w-10 h-10 mb-5 text-accent-amber" fill="none" stroke="currentColor" strokeWidth="1.2">
            <rect x="25" y="25" width="50" height="50" />
            <rect x="25" y="25" width="50" height="50" transform="rotate(45 50 50)" />
            <circle cx="50" cy="50" r="8" />
          </svg>
          <h1
            className="text-ink font-normal text-center"
            style={{ fontFamily: "var(--font-display)", fontSize: "28px", letterSpacing: "-0.3px", lineHeight: 1.2 }}
          >
            {heading}
          </h1>
          <p className="text-sm text-muted mt-2 text-center">{sub}</p>
        </div>

        {/* Card */}
        <div className="bg-surface-card rounded-xl border border-hairline p-8">
          <AuthForm view={view} />
        </div>

        {/* Bottom wordmark */}
        <p
          className="text-center mt-8 text-muted-soft"
          style={{ fontFamily: "var(--font-display)", fontSize: "15px", letterSpacing: "0.18em" }}
        >
          SHIA BAZAAR
        </p>
      </div>
    </div>
  );
}
