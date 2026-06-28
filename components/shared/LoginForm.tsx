"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Phase 1 mock: admin / admin goes to admin panel
    if (email === "admin" && password === "admin") {
      router.push("/admin");
      return;
    }

    setError("Invalid email or password.");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted uppercase tracking-wide">
          Email
        </label>
        <input
          type="text"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="ali@example.com"
          className="w-full h-11 px-4 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted-soft focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-muted uppercase tracking-wide">
            Password
          </label>
          <Link href="/forgot-password" className="text-xs text-primary hover:text-primary-active transition-colors">
            Forgot password?
          </Link>
        </div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="w-full h-11 px-4 text-sm border border-hairline rounded-md bg-canvas text-ink placeholder:text-muted-soft focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
        />
      </div>

      {error && (
        <p className="text-xs text-error">{error}</p>
      )}

      <button
        type="submit"
        className="w-full h-11 bg-primary text-on-primary text-sm font-medium rounded-md hover:bg-primary-active transition-colors flex items-center justify-center gap-2"
      >
        <Lock size={14} />
        Sign In
      </button>

      <p className="text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-primary hover:text-primary-active font-medium transition-colors">
          Create one
        </Link>
      </p>
    </form>
  );
}
