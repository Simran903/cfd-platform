"use client";

type PnLProps = {
  pnlByTradeId: Record<string, number>;
};

export default function PnL({ pnlByTradeId }: PnLProps) {
  const entries = Object.entries(pnlByTradeId);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-zinc-950/40 px-5 py-5 backdrop-blur-sm">
      <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
        Unrealized
      </span>
      <p
        className={`mt-3 font-mono text-3xl font-semibold tabular-nums tracking-tight ${
          total >= 0 ? "text-lime-400" : "text-rose-400"
        }`}
      >
        {total >= 0 ? "+" : ""}
        {total.toFixed(2)}
      </p>
      <div className="mt-4 max-h-28 space-y-2 overflow-y-auto text-xs">
        {entries.length === 0 ? (
          <p className="text-zinc-600">No open exposure</p>
        ) : (
          entries.map(([tradeId, value]) => (
            <div key={tradeId} className="flex items-center justify-between gap-3 border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
              <span className="truncate font-mono text-zinc-500">{tradeId.slice(0, 8)}…</span>
              <span
                className={`shrink-0 font-mono tabular-nums ${
                  value >= 0 ? "text-lime-400/90" : "text-rose-400/90"
                }`}
              >
                {value >= 0 ? "+" : ""}
                {value.toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
