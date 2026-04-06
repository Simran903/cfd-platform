"use client";

import PnL from "@/components/PnL";
import PriceTicker from "@/components/PriceTicker";
import Positions from "@/components/Positions";
import TradeForm from "@/components/TradeForm";
import { getMagicClient } from "@/lib/magic";
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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3000";
const isMisconfiguredApiBaseUrl = /magiclabs\.com/i.test(API_BASE_URL);

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

export default function Home() {
  const [token, setToken] = useState<string>("");
  const [email, setEmail] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [price, setPrice] = useState<number | null>(null);
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [positions, setPositions] = useState<Trade[]>([]);
  const [pnlByTradeId, setPnlByTradeId] = useState<Record<string, number>>({});
  const [events, setEvents] = useState<TradeEvent[]>([]);
  const [closingTradeId, setClosingTradeId] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected">(
    "disconnected",
  );

  const userId = getUserIdFromToken(token);
  const isAuthenticated = token.length > 0;
  const wsUrlWithToken = useMemo(() => {
    if (!token) return WS_URL;
    const separator = WS_URL.includes("?") ? "&" : "?";
    return `${WS_URL}${separator}token=${encodeURIComponent(token)}`;
  }, [token]);

  useEffect(() => {
    const savedToken = window.localStorage.getItem("cfd_token");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
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
        if (typeof payload.price === "number") {
          setPrice(payload.price);
        }
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
  }, [wsUrlWithToken, userId]);

  const handleAuth = async () => {
    setAuthError(null);
    setIsAuthenticating(true);
    try {
      if (isMisconfiguredApiBaseUrl) {
        setAuthError(
          "NEXT_PUBLIC_API_URL is pointing to Magic Labs. Set it to your backend URL (e.g. http://localhost:3000).",
        );
        return;
      }

      const magic = getMagicClient();
      // Email OTP (“enter code from email”) — matches Magic’s OTP modal flow.
      await magic.auth.loginWithEmailOTP({ email, showUI: true });
      const didToken = await magic.user.getIdToken();

      const response = await fetch(`${API_BASE_URL}/auth/magic/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          didToken,
          email: email.trim().toLowerCase(),
        }),
      });
      const data = (await response.json()) as { token?: string; message?: string };
      if (!response.ok || !data.token) {
        setAuthError(data.message ?? "Authentication failed");
        return;
      }

      setToken(data.token);
      window.localStorage.setItem("cfd_token", data.token);
    } catch {
      setAuthError("Network error while authenticating");
    } finally {
      setIsAuthenticating(false);
    }
  };

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

  return (
    <div className="mx-auto w-full max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">CFD Trading Dashboard</h1>
        {isAuthenticated ? (
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded border px-3 py-1.5 text-sm disabled:opacity-60"
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        ) : null}
      </div>

      {!isAuthenticated ? (
        <div className="max-w-md space-y-3 rounded-lg border p-4">
          <div className="text-lg font-semibold">Sign in with Magic Link</div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border p-2"
          />
          <button
            type="button"
            disabled={isAuthenticating || !email}
            onClick={handleAuth}
            className="w-full rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-60"
          >
            {isAuthenticating ? "Please wait..." : "Continue with Magic"}
          </button>
          {authError ? <div className="text-sm text-red-500">{authError}</div> : null}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <PriceTicker symbol={symbol} price={price} />
          <PnL pnlByTradeId={pnlByTradeId} />
          <div className="rounded-lg border p-4">
            <div className="text-sm text-gray-500">Session</div>
            <div className="mt-1 text-sm break-all">User: {userId ?? "Unknown"}</div>
            <div className="mt-1 text-xs text-gray-500">WebSocket: {wsStatus}</div>
          </div>
        </div>
      )}

      {isAuthenticated ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <TradeForm
            token={token}
            apiBaseUrl={API_BASE_URL}
            currentPrice={price}
            onTradeOpened={handleTradeOpened}
          />
          <Positions
            positions={positions}
            pnlByTradeId={pnlByTradeId}
            onClosePosition={handleClosePosition}
            isClosingTradeId={closingTradeId}
          />
        </div>
      ) : null}

      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-semibold">Trade Events</h2>
        <div className="mt-3 space-y-2 text-sm">
          {events.length === 0 ? (
            <div className="text-gray-500">Waiting for events...</div>
          ) : (
            events.map((event, index) => (
              <div key={`${event.type}-${event.tradeId ?? "none"}-${index}`} className="rounded border p-2">
                <div className="font-medium">{event.type}</div>
                {event.tradeId ? <div>Trade: {event.tradeId}</div> : null}
                {typeof event.pnl === "number" ? <div>PnL: {event.pnl.toFixed(2)}</div> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}