"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/client";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters"); return; }
    if (!token)               { setError("Invalid or expired reset link"); return; }

    setLoading(true);
    setError("");

    try {
      const { error: authError } = await authClient.resetPassword({ newPassword: password, token });
      if (authError) { setError(authError.message ?? "Failed to reset password"); }
      else { setSuccess(true); setTimeout(() => router.push("/auth/sign-in"), 2000); }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm text-error mb-4">Invalid or expired reset link.</p>
        <Link href="/auth/forgot-password" className="text-sm text-primary hover:text-primary-active font-medium">
          Request a new reset link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <p className="text-sm text-success mb-2">Password reset successfully!</p>
        <p className="text-xs text-muted">Redirecting to sign in…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted uppercase tracking-wide">New Password</label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={8}
          placeholder="At least 8 characters"
          className="h-10 px-3 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted uppercase tracking-wide">Confirm Password</label>
        <input
          type="password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          placeholder="Repeat new password"
          className="h-10 px-3 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="h-10 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors disabled:opacity-60"
      >
        {loading ? "Resetting…" : "Reset Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6 text-2xl font-normal tracking-tight text-ink" style={{ fontFamily: "var(--font-display)" }}>
            Shia Bazaar
          </Link>
          <h1 className="text-xl font-medium text-ink mb-1">Set new password</h1>
          <p className="text-sm text-muted">Enter and confirm your new password below.</p>
        </div>
        <div className="bg-surface-card rounded-xl border border-hairline p-6">
          <Suspense fallback={<div className="h-40 flex items-center justify-center text-muted text-sm">Loading…</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
        <p className="text-center mt-4 text-xs text-muted">
          Back to{" "}
          <Link href="/auth/sign-in" className="text-primary hover:text-primary-active font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
