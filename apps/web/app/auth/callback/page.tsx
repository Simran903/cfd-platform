"use client";

import { getMagicClient } from "@/lib/magic";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const didTokenFromUrl = searchParams.get("didToken") ?? searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "failed">("verifying");
  const [message, setMessage] = useState("Verifying…");

  useEffect(() => {
    const run = async () => {
      try {
        const magic = getMagicClient();
        let didToken = didTokenFromUrl;
        if (!didToken) {
          try {
            didToken = await magic.user.getIdToken();
          } catch {
            didToken = null;
          }
        }
        if (!didToken) {
          setStatus("failed");
          setMessage("Missing token.");
          return;
        }

        let email: string | undefined;
        try {
          const info = await magic.user.getInfo();
          email =
            typeof info.email === "string" ? info.email.trim().toLowerCase() : undefined;
        } catch {
          email = undefined;
        }

        const response = await fetch(`${API_BASE_URL}/auth/magic/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ didToken, ...(email ? { email } : {}) }),
        });
        const data = (await response.json()) as { token?: string; message?: string };

        if (!response.ok || !data.token) {
          setStatus("failed");
          setMessage(data.message ?? "Verification failed.");
          return;
        }

        window.localStorage.setItem("cfd_token", data.token);
        router.replace("/dashboard");
      } catch {
        setStatus("failed");
        setMessage("Network error.");
      }
    };

    void run();
  }, [didTokenFromUrl, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-zinc-950/40 p-8 text-center backdrop-blur-sm">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-zinc-500">
          Magic link
        </p>
        <h1 className="mt-3 text-lg font-semibold tracking-tight text-zinc-100">
          {status === "failed" ? "Couldn’t sign in" : "Signing in"}
        </h1>
        <p
          className={`mt-3 text-sm ${
            status === "failed" ? "text-rose-400" : "text-zinc-500"
          }`}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

export default function MagicLinkCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.06] bg-zinc-950/40 p-8 text-center backdrop-blur-sm">
            <p className="text-sm text-zinc-500">Loading…</p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
