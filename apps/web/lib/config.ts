export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:3000";

export const isMisconfiguredApiBaseUrl = /magiclabs\.com/i.test(API_BASE_URL);

/** Product name shown in marketing & auth UI */
export const BRAND = "Axis";
