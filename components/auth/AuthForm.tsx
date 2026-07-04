"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth/client";

type View = "sign-in" | "sign-up" | "forgot-password";

interface AuthFormProps {
  view: View;
}

const META: Record<View, { heading: string; sub: string }> = {
  "sign-in":         { heading: "Welcome back",      sub: "Sign in to your account" },
  "sign-up":         { heading: "Create an account", sub: "Join Shia Bazaar today" },
  "forgot-password": { heading: "Reset password",    sub: "We'll send a reset link to your email" },
};

export function AuthForm({ view }: AuthFormProps) {
  const router  = useRouter();
  const { heading, sub } = META[view];

  const [name,      setName]      = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [showPass,  setShowPass]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [done,      setDone]      = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (view === "sign-in") {
        const { error: err } = await authClient.signIn.email({
          email,
          password,
          callbackURL: "/",
        });
        if (err) { setError(err.message ?? "Incorrect email or password."); return; }
        router.push("/");
        router.refresh();

      } else if (view === "sign-up") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0],
          callbackURL: "/",
        });
        if (err) { setError(err.message ?? "Could not create account."); return; }
        router.push("/");
        router.refresh();

      } else {
        // forgot-password — Better Auth sends a reset email via the server
        const res = await fetch("/api/auth/forget-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, redirectTo: `${window.location.origin}/auth/reset-password` }),
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setError(d.message ?? "Something went wrong. Try again.");
          return;
        }
        setDone(true);
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Forgot-password success state ──────────────────
  if (done) {
    return (
      <div className="text-center py-4 flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-success" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-ink">Check your inbox</p>
          <p className="text-sm text-muted mt-1">
            We sent a reset link to <span className="text-ink">{email}</span>
          </p>
        </div>
        <Link href="/auth/sign-in" className="text-xs text-primary hover:text-primary-active transition-colors mt-2">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Name — sign-up only */}
      {view === "sign-up" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-medium text-muted uppercase tracking-[0.08em]">
            Full name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ali Hussain"
            autoComplete="name"
            className="w-full h-11 px-4 text-sm border border-hairline rounded-lg bg-canvas text-ink placeholder:text-muted-soft focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 transition-colors"
          />
        </div>
      )}

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium text-muted uppercase tracking-[0.08em]">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="ali@example.com"
          autoComplete="email"
          required
          className="w-full h-11 px-4 text-sm border border-hairline rounded-lg bg-canvas text-ink placeholder:text-muted-soft focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 transition-colors"
        />
      </div>

      {/* Password — sign-in and sign-up */}
      {view !== "forgot-password" && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-muted uppercase tracking-[0.08em]">
              Password
            </label>
            {view === "sign-in" && (
              <Link
                href="/auth/forgot-password"
                className="text-[11px] text-primary hover:text-primary-active transition-colors"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={view === "sign-up" ? "new-password" : "current-password"}
              required
              minLength={8}
              className="w-full h-11 pl-4 pr-11 text-sm border border-hairline rounded-lg bg-canvas text-ink placeholder:text-muted-soft focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/12 transition-colors"
            />
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPass(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {view === "sign-up" && (
            <p className="text-[11px] text-muted-soft">Minimum 8 characters</p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-[13px] text-error bg-error/6 border border-error/20 rounded-lg px-4 py-3 leading-snug">
          {error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 bg-primary text-on-primary text-sm font-medium rounded-lg hover:bg-primary-active transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {view === "sign-in"         && "Sign in"}
        {view === "sign-up"         && "Create account"}
        {view === "forgot-password" && "Send reset link"}
      </button>

      {/* Footer link */}
      <p className="text-center text-sm text-muted">
        {view === "sign-in" ? (
          <>Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up" className="text-primary hover:text-primary-active font-medium transition-colors">Create one</Link>
          </>
        ) : view === "sign-up" ? (
          <>Already have an account?{" "}
            <Link href="/auth/sign-in" className="text-primary hover:text-primary-active font-medium transition-colors">Sign in</Link>
          </>
        ) : (
          <Link href="/auth/sign-in" className="text-primary hover:text-primary-active transition-colors">Back to sign in</Link>
        )}
      </p>
    </form>
  );
}
