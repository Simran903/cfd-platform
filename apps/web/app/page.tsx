"use client";

import { BrandLink } from "@/components/BrandLink";
import { BRAND } from "@/lib/config";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    setHasSession(Boolean(window.localStorage.getItem("cfd_token")));
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <BrandLink />
          <nav className="flex items-center gap-6">
            <a
              href="#features"
              className="hidden text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-500 transition hover:text-zinc-300 sm:inline"
            >
              Features
            </a>
            {hasSession ? (
              <Link
                href="/dashboard"
                className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-950 transition hover:bg-white"
              >
                Open terminal
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-500 transition hover:text-zinc-300"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/login"
                  className="rounded-full bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-950 transition hover:bg-white"
                >
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-6 pb-24 pt-20 md:pt-28">
          <p className="text-center text-[11px] font-medium uppercase tracking-[0.3em] text-zinc-500">
            Crypto CFDs
          </p>
          <h1 className="mx-auto mt-6 max-w-2xl text-center text-4xl font-semibold tracking-tight text-zinc-50 md:text-5xl md:leading-[1.1]">
            Trade with clarity.
            <span className="block text-zinc-500">Built for focus.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-center text-base leading-relaxed text-zinc-500">
            {BRAND} is a minimal trading terminal: live marks, positions, and risk — without the
            noise.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            {hasSession ? (
              <Link
                href="/dashboard"
                className="w-full rounded-full bg-zinc-100 px-8 py-3 text-center text-sm font-medium text-zinc-950 transition hover:bg-white sm:w-auto"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="w-full rounded-full bg-zinc-100 px-8 py-3 text-center text-sm font-medium text-zinc-950 transition hover:bg-white sm:w-auto"
                >
                  Get started
                </Link>
                <Link
                  href="/auth/login"
                  className="w-full rounded-full border border-white/[0.1] px-8 py-3 text-center text-sm font-medium text-zinc-300 transition hover:border-white/[0.15] hover:bg-white/[0.03] sm:w-auto"
                >
                  Sign in
                </Link>
              </>
            )}
          </div>
        </section>

        <section
          id="features"
          className="border-t border-white/[0.06] bg-zinc-950/30 py-20"
        >
          <div className="mx-auto grid max-w-5xl gap-12 px-6 md:grid-cols-3">
            <div>
              <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                Live
              </h2>
              <p className="mt-3 text-lg font-medium text-zinc-100">Streamed prices</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Marks update in real time so your PnL reflects the book.
              </p>
            </div>
            <div>
              <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                Control
              </h2>
              <p className="mt-3 text-lg font-medium text-zinc-100">Leverage &amp; sides</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Open long or short with configurable leverage from one panel.
              </p>
            </div>
            <div>
              <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
                Session
              </h2>
              <p className="mt-3 text-lg font-medium text-zinc-100">Passwordless auth</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                Sign in with email and a one-time code — no passwords to manage.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Ready when you are.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-zinc-500">
            Create an account in seconds and open the terminal.
          </p>
          <Link
            href={hasSession ? "/dashboard" : "/auth/login"}
            className="mt-8 inline-flex rounded-full bg-zinc-100 px-8 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white"
          >
            {hasSession ? "Open terminal" : "Get started"}
          </Link>
        </section>

        <footer className="border-t border-white/[0.06] py-8">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
            <BrandLink />
            <p className="text-xs text-zinc-600">Paper / demo environment.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
