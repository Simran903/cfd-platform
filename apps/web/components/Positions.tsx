"use client";

type Position = {
  id: string;
  assetSymbol: string;
  side: "LONG" | "SHORT";
  leverage: number;
  quantity: number;
  entryPrice: number;
};

type PositionsProps = {
  positions: Position[];
  pnlByTradeId: Record<string, number>;
  onClosePosition: (tradeId: string) => Promise<void>;
  isClosingTradeId: string | null;
};

export default function Positions({
  positions,
  pnlByTradeId,
  onClosePosition,
  isClosingTradeId,
}: PositionsProps) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/40 p-6 backdrop-blur-sm">
      <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">Positions</h2>

      <div className="mt-5 space-y-3">
        {positions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/[0.06] py-12 text-center text-sm text-zinc-600">
            No open positions
          </p>
        ) : (
          positions.map((position) => {
            const pnl = pnlByTradeId[position.id] ?? 0;
            const isClosing = isClosingTradeId === position.id;

            return (
              <div
                key={position.id}
                className="rounded-xl border border-white/[0.06] bg-zinc-900/30 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-base font-medium tracking-tight text-zinc-100">
                      {position.assetSymbol}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-zinc-600">{position.id}</p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      position.side === "LONG"
                        ? "bg-lime-400/10 text-lime-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {position.side}
                  </span>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                  <div>
                    <dt className="text-zinc-600">Qty</dt>
                    <dd className="mt-0.5 font-mono text-zinc-300">{position.quantity}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-600">Lev</dt>
                    <dd className="mt-0.5 font-mono text-zinc-300">{position.leverage}×</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-600">Entry</dt>
                    <dd className="mt-0.5 font-mono text-zinc-300">{position.entryPrice.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-zinc-600">uPnL</dt>
                    <dd
                      className={`mt-0.5 font-mono ${
                        pnl >= 0 ? "text-lime-400" : "text-rose-400"
                      }`}
                    >
                      {pnl >= 0 ? "+" : ""}
                      {pnl.toFixed(2)}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => onClosePosition(position.id)}
                  disabled={isClosing}
                  className="mt-4 w-full rounded-lg border border-white/[0.08] py-2 text-xs font-medium text-zinc-300 transition hover:border-white/[0.12] hover:bg-white/[0.03] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isClosing ? "Closing…" : "Close"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
