"use client";

import { create } from "zustand";
import type { StreamSource } from "@/lib/market/stream";

interface PriceEntry {
  price: number;
  prev: number;
}

interface PriceState {
  prices: Record<string, PriceEntry>;
  source: StreamSource;
  setPrice: (symbol: string, price: number) => void;
  setSource: (source: StreamSource) => void;
}

export const usePriceStore = create<PriceState>((set) => ({
  prices: {},
  source: "connecting",
  setPrice: (symbol, price) =>
    set((state) => {
      const existing = state.prices[symbol];
      if (existing && existing.price === price) return state;
      return {
        prices: {
          ...state.prices,
          [symbol]: { price, prev: existing?.price ?? price },
        },
      };
    }),
  setSource: (source) => set({ source }),
}));

/** Subscribe to a single symbol's live price entry. */
export function usePrice(symbol: string): PriceEntry | undefined {
  return usePriceStore((s) => s.prices[symbol]);
}

/** Read the latest price without subscribing to re-renders. */
export function priceOf(symbol: string): number {
  return usePriceStore.getState().prices[symbol]?.price ?? 0;
}
