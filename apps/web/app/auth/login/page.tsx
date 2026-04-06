"use client";

import { getMagicClient } from "@/lib/magic";
import {
  API_BASE_URL,
  BRAND,
  isMisconfiguredApiBaseUrl,
} from "@/lib/config";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const existing = window.localStorage.getItem("cfd_token");
    if (existing) {
      router.replace("/dashboard");
    }
  }, [router]);

  const handleAuth = async () => {
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      if (isMisconfiguredApiBaseUrl) {
        setAuthError(
          "NEXT_PUBLIC_API_URL is pointing to Magic Labs. Set it to your backend URL (e.g. http://localhost:3000).",
        );
        return;
      }

      const magic = getMagicClient();
      await magic.auth.loginWithEmailOTP({ email, showUI: true });
      const didToken = await magic.user.getIdToken();

      const response = await fetch(`${API_BASE_URL}/auth/magic/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          didToken,
          email: email.trim().toLowerCase(),
        }),
      });
      const data = (await response.json()) as { token?: string; message?: string };
      if (!response.ok || !data.token) {
        setAuthError(data.message ?? "Authentication failed");
        return;
      }

      window.localStorage.setItem("cfd_token", data.token);
      router.replace("/dashboard");
    } catch {
      setAuthError("Network error while authenticating");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <p className="text-center text-[11px] font-medium uppercase tracking-[0.25em] text-zinc-500">
        Sign in
      </p>
      <h1 className="mt-3 text-center text-2xl font-semibold tracking-tight text-zinc-100">
        Welcome back
      </h1>
      <p className="mt-2 text-center text-sm text-zinc-500">
        Enter your email — we&apos;ll send a one-time code with {BRAND}.
      </p>

      <div className="mt-10 space-y-4 rounded-2xl border border-white/[0.06] bg-zinc-950/40 p-6 backdrop-blur-sm">
        <label className="block">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Email
          </span>
          <input
            type="email"
            placeholder="you@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-zinc-900/60 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-lime-400/25 focus:outline-none focus:ring-1 focus:ring-lime-400/20"
          />
        </label>
        <button
          type="button"
          disabled={isAuthenticating || !email}
          onClick={handleAuth}
          className="w-full rounded-xl bg-zinc-100 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isAuthenticating ? "Continue…" : "Continue"}
        </button>
        {authError ? (
          <p className="text-center text-xs text-rose-400">{authError}</p>
        ) : null}
      </div>

      <p className="mt-8 text-center text-xs text-zinc-600">
        By continuing you agree to our terms and privacy policy.
      </p>
    </div>
  );
}
