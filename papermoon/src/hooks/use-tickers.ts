"use client";

import { useQuery } from "@tanstack/react-query";
import type { Ticker } from "@/lib/types";

interface TickersResponse {
  tickers: Ticker[];
  source: "live" | "synthetic";
}

async function fetchTickers(symbols?: string[]): Promise<TickersResponse> {
  const q = symbols && symbols.length ? `?symbols=${symbols.join(",")}` : "";
  const res = await fetch(`/api/market/ticker${q}`);
  if (!res.ok) throw new Error(`Failed to load tickers (${res.status})`);
  return res.json();
}

/** Fetch 24h ticker stats for all symbols (or a subset), polled every 15s. */
export function useTickers(symbols?: string[]) {
  return useQuery({
    queryKey: ["tickers", symbols ?? "all"],
    queryFn: () => fetchTickers(symbols),
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

export function useTicker(symbol: string): Ticker | undefined {
  const { data } = useTickers([symbol]);
  return data?.tickers?.[0];
}
