"use client";

import { Magic } from "magic-sdk";

let magicClient: Magic | null = null;

export const getMagicClient = () => {
  if (magicClient) return magicClient;

  const publishableKey = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY;
  if (!publishableKey) {
    throw new Error("NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY is not set");
  }

  magicClient = new Magic(publishableKey);
  return magicClient;
};
