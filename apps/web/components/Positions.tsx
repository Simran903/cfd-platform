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
    <div>
      <h2 className="text-lg font-semibold">Positions</h2>

      <div className="mt-3 space-y-2">
        {positions.length === 0 ? (
          <div className="rounded border p-3 text-sm text-gray-500">
            No open trades.
          </div>
        ) : (
          positions.map((position) => {
            const pnl = pnlByTradeId[position.id] ?? 0;
            const isClosing = isClosingTradeId === position.id;

            return (
              <div key={position.id} className="rounded border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{position.assetSymbol}</div>
                    <div className="text-xs text-gray-500">{position.id}</div>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${
                      position.side === "LONG"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {position.side}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>Qty: {position.quantity}</div>
                  <div>Lev: {position.leverage}x</div>
                  <div>Entry: {position.entryPrice.toFixed(2)}</div>
                  <div className={pnl >= 0 ? "text-green-500" : "text-red-500"}>
                    PnL: {pnl.toFixed(2)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onClosePosition(position.id)}
                  disabled={isClosing}
                  className="mt-3 rounded bg-black px-3 py-1.5 text-sm text-white disabled:opacity-60"
                >
                  {isClosing ? "Closing..." : "Close Position"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}