"use client";

import { useQuery } from "@tanstack/react-query";
import type { Candle } from "@/lib/types";

interface KlinesResponse {
  candles: Candle[];
  source: "live" | "synthetic";
}

async function fetchKlines(symbol: string, interval: string, limit: number): Promise<KlinesResponse> {
  const res = await fetch(`/api/market/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to load candles (${res.status})`);
  return res.json();
}

export function useKlines(symbol: string, interval: string, limit = 400) {
  return useQuery({
    queryKey: ["klines", symbol, interval, limit],
    queryFn: () => fetchKlines(symbol, interval, limit),
    staleTime: 10_000,
    refetchOnWindowFocus: false,
  });
}
