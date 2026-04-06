import type { ReactNode } from "react";
import Link from "next/link";
import { BrandLink } from "@/components/BrandLink";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-lg items-center justify-between px-6 py-5">
          <BrandLink />
          <Link
            href="/"
            className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-500 transition hover:text-zinc-300"
          >
            Home
          </Link>
        </div>
      </header>
      <div className="flex flex-1 flex-col items-center px-6 py-12">{children}</div>
    </div>
  );
}
