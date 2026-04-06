type PnLProps = {
  pnlByTradeId: Record<string, number>;
};

export default function PnL({ pnlByTradeId }: PnLProps) {
  const entries = Object.entries(pnlByTradeId);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-gray-500">Unrealized PnL</div>
      <div className={`mt-1 text-2xl font-semibold ${total >= 0 ? "text-green-500" : "text-red-500"}`}>
        {total.toFixed(2)}
      </div>
      <div className="mt-3 space-y-1 text-sm">
        {entries.length === 0 ? (
          <div className="text-gray-500">No active positions yet.</div>
        ) : (
          entries.map(([tradeId, value]) => (
            <div key={tradeId} className="flex justify-between">
              <span className="truncate pr-3">{tradeId}</span>
              <span className={value >= 0 ? "text-green-500" : "text-red-500"}>
                {value.toFixed(2)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
