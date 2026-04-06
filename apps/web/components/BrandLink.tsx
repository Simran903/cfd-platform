import Link from "next/link";
import { BRAND } from "@/lib/config";

export function BrandLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-baseline gap-2 transition hover:opacity-90 ${className}`}
    >
      <span className="text-sm font-semibold tracking-tight text-zinc-100">{BRAND}</span>
      <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-600">
        trade
      </span>
    </Link>
  );
}
