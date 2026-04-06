"use client";

import { getMagicClient } from "@/lib/magic";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

export default function MagicLinkCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const didTokenFromUrl = searchParams.get("didToken") ?? searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "failed">("verifying");
  const [message, setMessage] = useState("Verifying magic link...");

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
          setMessage("Missing DID token.");
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
          setMessage(data.message ?? "Failed to verify magic link.");
          return;
        }

        window.localStorage.setItem("cfd_token", data.token);
        router.replace("/");
      } catch {
        setStatus("failed");
        setMessage("Network error while verifying link.");
      }
    };

    void run();
  }, [didTokenFromUrl, router]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <div className="w-full rounded-lg border p-5">
        <h1 className="text-lg font-semibold">Magic Link Sign-In</h1>
        <p className={`mt-2 text-sm ${status === "failed" ? "text-red-500" : "text-gray-600"}`}>
          {message}
        </p>
      </div>
    </div>
  );
}
