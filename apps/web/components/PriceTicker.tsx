"use client";

export type MarkFeedSource = "socket" | "rest" | "none";

type PriceTickerProps = {
  symbol: string;
  price: number | null;
  feedSource: MarkFeedSource;
  wsStatus: "connecting" | "connected" | "disconnected";
};

export default function PriceTicker({
  symbol,
  price,
  feedSource,
  wsStatus,
}: PriceTickerProps) {
  const feedLabel =
    feedSource === "socket"
      ? "Socket + Redis"
      : feedSource === "rest"
        ? "REST (Binance)"
        : "No data";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-950/40 px-5 py-5 backdrop-blur-sm">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-lime-400/[0.06] blur-2xl" aria-hidden />
      <div className="relative flex flex-col justify-between gap-4">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
            Mark price
          </span>
          <span
            className={`max-w-[11rem] text-right text-[10px] font-medium uppercase tracking-wider ${
              feedSource === "socket"
                ? "text-lime-400/90"
                : feedSource === "rest"
                  ? "text-amber-400/90"
                  : "text-zinc-600"
            }`}
            title={
              feedSource === "rest"
                ? "Backend price poller or WebSocket not delivering; showing direct Binance quote."
                : feedSource === "socket"
                  ? "Streamed via Redis from your price poller."
                  : undefined
            }
          >
            {feedLabel}
          </span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-mono text-lg font-medium tracking-tight text-zinc-300">
              {symbol}
            </span>
            <p className="mt-1 text-[10px] text-zinc-600">
              WS:{" "}
              {wsStatus === "connected"
                ? "connected"
                : wsStatus === "connecting"
                  ? "connecting"
                  : "disconnected"}
            </p>
          </div>
          <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight text-zinc-50 sm:text-4xl">
            {price === null ? (
              <span className="text-zinc-600">—</span>
            ) : (
              price.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
