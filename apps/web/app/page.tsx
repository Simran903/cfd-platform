"use client";

import React, { useEffect, useState } from "react";

export default function Page() {
  const [price, setPrice] = useState<string>("—");
  const [pnl, setPnl] = useState<string>("—");
  const [tradeEvent, setTradeEvent] = useState<string>("—");

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000");

    ws.onmessage = (event) => {
      const { channel, data } = JSON.parse(event.data) as {
        channel: string;
        data: unknown;
      };

      if (channel === "prices") {
        setPrice(typeof data === "string" ? data : JSON.stringify(data));
      }

      if (channel === "pnl_updates") {
        setPnl(typeof data === "string" ? data : JSON.stringify(data));
      }

      if (channel === "trade_events") {
        setTradeEvent(
          typeof data === "string" ? data : JSON.stringify(data),
        );
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div>
      <h1>WebSocket</h1>
      <p>Price: {price}</p>
      <p>PnL: {pnl}</p>
      <p>Trade event: {tradeEvent}</p>
    </div>
  );
}
