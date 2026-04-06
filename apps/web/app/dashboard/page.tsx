"use client";

import { BrandLink } from "@/components/BrandLink";
import PnL from "@/components/PnL";
import PriceTicker from "@/components/PriceTicker";
import type { MarkFeedSource } from "@/components/PriceTicker";
import Positions from "@/components/Positions";
import TradeForm from "@/components/TradeForm";
import { API_BASE_URL, WS_URL } from "@/lib/config";
import { fetchBtcUsdtMark } from "@/lib/binance";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type TradeSide = "LONG" | "SHORT";

type Trade = {
  id: string;
  userId: string;
  assetSymbol: string;
  side: TradeSide;
  leverage: number;
  quantity: number;
  entryPrice: number;
  createdAt: number;
};

type TradeEvent = {
  type: string;
  tradeId?: string;
  pnl?: number;
};

const getUserIdFromToken = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const payloadRaw = token.split(".")[1];
    if (!payloadRaw) return null;

    const normalized = payloadRaw.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized)) as { userId?: unknown };
    return typeof decoded.userId === "string" ? decoded.userId : null;
  } catch {
    return null;
  }
};

function parseNumericField(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function ConnectionDot({ status }: { status: "connecting" | "connected" | "disconnected" }) {
  const color =
    status === "connected"
      ? "bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.5)]"
      : status === "connecting"
        ? "bg-amber-400 animate-pulse"
        : "bg-zinc-600";
  return (
    <span className="flex items-center gap-2 text-[11px] text-zinc-500">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} aria-hidden />
      <span className="uppercase tracking-wider">
        {status === "connected" ? "Live" : status === "connecting" ? "Sync" : "Idle"}
      </span>
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [sessionReady, setSessionReady] = useState(false);
  const [token, setToken] = useState<string>("");

  const [wsMark, setWsMark] = useState<number | null>(null);
  const [restMark, setRestMark] = useState<number | null>(null);
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [positions, setPositions] = useState<Trade[]>([]);
  const [pnlByTradeId, setPnlByTradeId] = useState<Record<string, number>>({});
  const [events, setEvents] = useState<TradeEvent[]>([]);
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">(
    "disconnected",
  );

  const markPrice = wsMark ?? restMark;
  const feedSource: MarkFeedSource =
    wsMark !== null ? "socket" : restMark !== null ? "rest" : "none";

  const userId = getUserIdFromToken(token);
  const wsUrlWithToken = useMemo(() => {
    if (!token) return WS_URL;
    const separator = WS_URL.includes("?") ? "&" : "?";
    return `${WS_URL}${separator}token=${encodeURIComponent(token)}`;
  }, [token]);

  useEffect(() => {
    const saved = window.localStorage.getItem("cfd_token");
    if (!saved) {
      router.replace("/auth/login");
      return;
    }
    setToken(saved);
    setSessionReady(true);
  }, [router]);

  /** REST fallback: shows a mark even when Redis price poller or WS path is down. */
  useEffect(() => {
    if (!sessionReady) return;

    let cancelled = false;
    const poll = async () => {
      const p = await fetchBtcUsdtMark();
      if (!cancelled && p !== null) setRestMark(p);
    };

    void poll();
    const id = window.setInterval(poll, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [sessionReady]);

  useEffect(() => {
    if (!sessionReady || !token) return;

    const ws = new WebSocket(wsUrlWithToken);
    setWsStatus("connecting");

    type WsMessage = { channel: string; data: unknown };
    type PricePayload = { symbol?: unknown; price?: unknown };
    type PnlUpdatePayload = { tradeId?: unknown; pnl?: unknown };
    type TradeEventPayload = {
      type?: unknown;
      tradeId?: unknown;
      pnl?: unknown;
      trade?: unknown;
    };

    type OpenTradeEventPayload = {
      trade?: {
        id?: unknown;
        userId?: unknown;
        assetId?: unknown;
        assetSymbol?: unknown;
        side?: unknown;
        leverage?: unknown;
        quantity?: unknown;
        entryPrice?: unknown;
        createdAt?: unknown;
      };
    };

    ws.onopen = () => setWsStatus("connected");
    ws.onclose = () => setWsStatus("disconnected");
    ws.onerror = () => setWsStatus("disconnected");

    ws.onmessage = (event: MessageEvent) => {
      let parsed: WsMessage;
      try {
        parsed = JSON.parse(event.data as string) as WsMessage;
      } catch {
        return;
      }
      const { channel, data } = parsed;

      if (channel === "prices") {
        const payload = data as PricePayload;
        if (typeof payload.symbol === "string") {
          setSymbol(payload.symbol);
        }
        const n = parseNumericField(payload.price);
        if (n !== null) setWsMark(n);
        return;
      }

      if (channel === "pnl_updates") {
        const payload = data as PnlUpdatePayload;
        if (typeof payload.tradeId !== "string") return;
        if (typeof payload.pnl !== "number") return;

        const tradeId = payload.tradeId;
        const pnlValue = payload.pnl;

        setPnlByTradeId((prev) => ({
          ...prev,
          [tradeId]: pnlValue,
        }));
        return;
      }

      if (channel === "trade_events") {
        const payload = data as TradeEventPayload;
        if (typeof payload.type !== "string") return;
        const eventType = payload.type;
        const tradeId = typeof payload.tradeId === "string" ? payload.tradeId : undefined;
        const pnl = typeof payload.pnl === "number" ? payload.pnl : undefined;

        if (eventType === "TRADE_OPENED") {
          const tradePayload = (payload as OpenTradeEventPayload).trade;
          const assetSymbol =
            typeof tradePayload?.assetSymbol === "string"
              ? tradePayload.assetSymbol
              : typeof tradePayload?.assetId === "string"
                ? tradePayload.assetId
                : null;
          const isValidTrade =
            tradePayload &&
            typeof tradePayload.id === "string" &&
            typeof tradePayload.userId === "string" &&
            typeof assetSymbol === "string" &&
            (tradePayload.side === "LONG" || tradePayload.side === "SHORT") &&
            typeof tradePayload.leverage === "number" &&
            typeof tradePayload.quantity === "number" &&
            typeof tradePayload.entryPrice === "number" &&
            typeof tradePayload.createdAt === "number";

          if (!isValidTrade) return;
          if (userId && tradePayload.userId !== userId) return;

          const trade = { ...tradePayload, assetSymbol } as Trade;
          setPositions((prev) => (prev.some((item) => item.id === trade.id) ? prev : [trade, ...prev]));
          setEvents((prev) => [{ type: eventType, tradeId: trade.id }, ...prev].slice(0, 30));
          return;
        }

        if (eventType === "TRADE_CLOSED" || eventType === "TRADE_LIQUIDATED") {
          if (!tradeId) return;

          setPositions((prev) => prev.filter((position) => position.id !== tradeId));
          setPnlByTradeId((prev) => {
            const next = { ...prev };
            delete next[tradeId];
            return next;
          });
          setEvents((prev) => [{ type: eventType, tradeId, pnl }, ...prev].slice(0, 30));
        }
      }
    };

    return () => ws.close();
  }, [wsUrlWithToken, userId, sessionReady, token]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch {
      // Always clear local state even if logout request fails.
    } finally {
      setToken("");
      setPositions([]);
      setPnlByTradeId({});
      setEvents([]);
      window.localStorage.removeItem("cfd_token");
      setIsLoggingOut(false);
      router.push("/auth/login");
    }
  };

  const handleTradeOpened = (trade: Trade) => {
    setPositions((prev) => {
      const normalized = {
        ...trade,
        assetSymbol: trade.assetSymbol ?? (trade as Trade & { assetId?: string }).assetId ?? "BTCUSDT",
      };
      return prev.some((item) => item.id === normalized.id) ? prev : [normalized, ...prev];
    });
  };

  const handleClosePosition = async (tradeId: string) => {
    setClosingTradeId(tradeId);
    try {
      const response = await fetch(`${API_BASE_URL}/trade/close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tradeId }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message ?? "Failed to close trade");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to close trade";
      setEvents((prev) => [{ type: `ERROR: ${message}`, tradeId }, ...prev].slice(0, 30));
    } finally {
      setClosingTradeId(null);
    }
  };

  if (!sessionReady) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3">
        <div className="h-1 w-8 animate-pulse rounded-full bg-zinc-700" />
        <p className="text-xs text-zinc-500">Loading workspace…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <BrandLink />
            <p className="mt-1 text-xs text-zinc-600">Trading workspace</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="text-[11px] font-medium uppercase tracking-[0.15em] text-zinc-500 transition hover:text-zinc-300 disabled:opacity-40"
          >
            {isLoggingOut ? "…" : "Sign out"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
          <div className="lg:col-span-5">
            <PriceTicker
              symbol={symbol}
              price={markPrice}
              feedSource={feedSource}
              wsStatus={wsStatus}
            />
          </div>
          <div className="lg:col-span-4">
            <PnL pnlByTradeId={pnlByTradeId} />
          </div>
          <div className="flex flex-col justify-between rounded-2xl border border-white/[0.06] bg-zinc-950/40 px-5 py-5 backdrop-blur-sm lg:col-span-3">
            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Session
            </span>
            <p className="mt-3 line-clamp-3 font-mono text-[11px] leading-relaxed text-zinc-400 break-all">
              {userId ?? "—"}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-white/[0.04] pt-4">
              <ConnectionDot status={wsStatus} />
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:gap-10">
          <section>
            <h2 className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Order
            </h2>
            <TradeForm
              token={token}
              apiBaseUrl={API_BASE_URL}
              currentPrice={markPrice}
              onTradeOpened={handleTradeOpened}
            />
          </section>
          <section>
            <h2 className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              Book
            </h2>
            <Positions
              positions={positions}
              pnlByTradeId={pnlByTradeId}
              onClosePosition={handleClosePosition}
              isClosingTradeId={closingTradeId}
            />
          </section>
        </div>

        <section className="mt-12 rounded-2xl border border-white/[0.06] bg-zinc-950/20 px-5 py-6">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">
            Activity
          </h2>
          <div className="mt-4 max-h-48 space-y-1 overflow-y-auto font-mono text-[11px]">
            {events.length === 0 ? (
              <p className="text-zinc-600">No events yet</p>
            ) : (
              events.map((event, index) => (
                <div
                  key={`${event.type}-${event.tradeId ?? "none"}-${index}`}
                  className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-white/[0.04] py-2 text-zinc-400 last:border-0"
                >
                  <span className="text-zinc-500">{event.type}</span>
                  {event.tradeId ? (
                    <span className="text-zinc-600">{event.tradeId.slice(0, 12)}…</span>
                  ) : null}
                  {typeof event.pnl === "number" ? (
                    <span className={event.pnl >= 0 ? "text-lime-400/90" : "text-rose-400/90"}>
                      {event.pnl >= 0 ? "+" : ""}
                      {event.pnl.toFixed(2)}
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
