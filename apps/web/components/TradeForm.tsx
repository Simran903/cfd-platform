"use client";

import { useState } from "react";

type TradeSide = "LONG" | "SHORT";

type OpenTradePayload = {
  assetId: string;
  side: TradeSide;
  leverage: number;
  quantity: number;
  price: number;
};

type TradeResponse = {
  trade: {
    id: string;
    userId: string;
    assetId?: string;
    assetSymbol?: string;
    side: TradeSide;
    leverage: number;
    quantity: number;
    entryPrice: number;
    createdAt: number;
  };
};

type TradeFormProps = {
  token: string;
  apiBaseUrl: string;
  currentPrice: number | null;
  onTradeOpened: (trade: {
    id: string;
    userId: string;
    assetSymbol: string;
    side: TradeSide;
    leverage: number;
    quantity: number;
    entryPrice: number;
    createdAt: number;
  }) => void;
};

const inputClass =
  "w-full rounded-xl border border-white/[0.08] bg-zinc-900/60 px-3 py-2.5 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-lime-400/25 focus:outline-none focus:ring-1 focus:ring-lime-400/20";

export default function TradeForm({
  token,
  apiBaseUrl,
  currentPrice,
  onTradeOpened,
}: TradeFormProps) {
  const [form, setForm] = useState({
    assetId: "BTCUSDT",
    side: "LONG" as TradeSide,
    leverage: 10,
    quantity: 0.01,
    price: 73000,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const openTrade = async () => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const payload: OpenTradePayload = {
        ...form,
        price: currentPrice ?? form.price,
      };

      const response = await fetch(`${apiBaseUrl}/trade/open`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as TradeResponse & { message?: string };
      if (!response.ok) {
        setError(data.message ?? "Unable to open trade");
        return;
      }

      const openedTrade = data.trade;
      const assetSymbol = openedTrade.assetSymbol ?? openedTrade.assetId ?? form.assetId;
      onTradeOpened({
        id: openedTrade.id,
        userId: openedTrade.userId,
        assetSymbol,
        side: openedTrade.side,
        leverage: openedTrade.leverage,
        quantity: openedTrade.quantity,
        entryPrice: openedTrade.entryPrice,
        createdAt: openedTrade.createdAt,
      });
      setSuccess(`Opened ${openedTrade.id.slice(0, 8)}…`);
    } catch {
      setError("Network error while opening trade");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-zinc-950/40 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
          New order
        </h2>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-zinc-900/80 p-1">
        <button
          type="button"
          onClick={() => setForm({ ...form, side: "LONG" })}
          className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${
            form.side === "LONG"
              ? "bg-lime-400/15 text-lime-300 shadow-sm shadow-lime-400/5"
              : "text-zinc-500 hover:text-zinc-400"
          }`}
        >
          Long
        </button>
        <button
          type="button"
          onClick={() => setForm({ ...form, side: "SHORT" })}
          className={`rounded-lg py-2.5 text-sm font-medium transition-colors ${
            form.side === "SHORT"
              ? "bg-rose-500/15 text-rose-300 shadow-sm shadow-rose-500/5"
              : "text-zinc-500 hover:text-zinc-400"
          }`}
        >
          Short
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Size</span>
          <input
            type="number"
            step="0.001"
            min="0.001"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
            className={`${inputClass} mt-1.5`}
          />
        </label>

        <label className="block">
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">Entry</span>
          <input
            type="number"
            min="1"
            value={currentPrice ?? form.price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            className={`${inputClass} mt-1.5`}
          />
        </label>

        <div>
          <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            <span>Leverage</span>
            <span className="font-mono text-zinc-300">{form.leverage}×</span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={form.leverage}
            onChange={(e) => setForm({ ...form, leverage: Number(e.target.value) })}
            className="mt-3 h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-lime-400"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={openTrade}
        disabled={isSubmitting || !token}
        className="mt-6 w-full rounded-xl bg-zinc-100 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? "Submitting…" : "Open position"}
      </button>

      {error ? <p className="mt-3 text-center text-xs text-rose-400">{error}</p> : null}
      {success ? <p className="mt-3 text-center text-xs text-lime-400/90">{success}</p> : null}
    </div>
  );
}
