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
      setSuccess(`Trade opened: ${data.trade.id}`);
    } catch {
      setError("Network error while opening trade");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 border rounded space-y-4">
      <h2 className="text-lg font-semibold">Trade Panel</h2>

      {/* LONG / SHORT buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setForm({ ...form, side: "LONG" })}
          className={`px-4 py-2 rounded ${
            form.side === "LONG"
              ? "bg-green-500 text-white"
              : "bg-gray-200"
          }`}
        >
          LONG
        </button>

        <button
          type="button"
          onClick={() => setForm({ ...form, side: "SHORT" })}
          className={`px-4 py-2 rounded ${
            form.side === "SHORT"
              ? "bg-red-500 text-white"
              : "bg-gray-200"
          }`}
        >
          SHORT
        </button>
      </div>

      {/* Quantity */}
      <div>
        <label className="text-sm text-gray-500">Quantity</label>
        <input
          type="number"
          step="0.001"
          min="0.001"
          value={form.quantity}
          onChange={(e) =>
            setForm({ ...form, quantity: Number(e.target.value) })
          }
          className="border p-2 w-full"
        />
      </div>

      {/* Entry Price */}
      <div>
        <label className="text-sm text-gray-500">Entry Price</label>
        <input
          type="number"
          min="1"
          value={currentPrice ?? form.price}
          onChange={(e) =>
            setForm({ ...form, price: Number(e.target.value) })
          }
          className="border p-2 w-full"
        />
      </div>

      {/* Leverage */}
      <div>
        <label className="text-sm text-gray-500">Leverage: {form.leverage}x</label>
        <input
          type="range"
          min={1}
          max={20}
          value={form.leverage}
          onChange={(e) =>
            setForm({ ...form, leverage: Number(e.target.value) })
          }
          className="w-full"
        />
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={openTrade}
        disabled={isSubmitting || !token}
        className="bg-blue-500 text-white px-4 py-2 rounded w-full"
      >
        {isSubmitting ? "Submitting..." : "Open Trade"}
      </button>

      {error ? <div className="text-sm text-red-500">{error}</div> : null}
      {success ? <div className="text-sm text-green-600">{success}</div> : null}
    </div>
  );
}