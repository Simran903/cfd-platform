/** Public Binance ticker — used as a UI fallback when Redis/WebSocket feed is unavailable. */
export async function fetchBtcUsdtMark(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { price?: string };
    if (typeof json.price !== "string") return null;
    const n = Number(json.price);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}
