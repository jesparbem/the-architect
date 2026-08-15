// Server-side Binance fetchers with automatic synthetic fallback.
// If Binance is unreachable (network policy, geo-restriction, offline), the
// app transparently serves synthetic data so it keeps working everywhere.

import type { Candle, Ticker } from "@/lib/types";
import { syntheticCandles, syntheticTicker } from "./synthetic";

const REST_BASE = process.env.NEXT_PUBLIC_BINANCE_REST_URL || "https://api.binance.com";
const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const TIMEOUT_MS = 4000;

export type DataSource = "live" | "synthetic";

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function getKlines(
  symbol: string,
  interval: string,
  limit: number,
): Promise<{ candles: Candle[]; source: DataSource }> {
  if (!DEMO) {
    try {
      const url = `${REST_BASE}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
      const raw = (await fetchJson(url)) as unknown[];
      if (Array.isArray(raw) && raw.length) {
        const candles: Candle[] = raw.map((k) => {
          const row = k as (string | number)[];
          return {
            time: Math.floor(Number(row[0]) / 1000),
            open: Number(row[1]),
            high: Number(row[2]),
            low: Number(row[3]),
            close: Number(row[4]),
            volume: Number(row[5]),
          };
        });
        return { candles, source: "live" };
      }
    } catch {
      // fall through to synthetic
    }
  }
  return { candles: syntheticCandles(symbol, interval, limit), source: "synthetic" };
}

interface Binance24h {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  quoteVolume: string;
}

export async function getTickers(
  symbols: string[],
): Promise<{ tickers: Ticker[]; source: DataSource }> {
  if (!DEMO) {
    try {
      const param = encodeURIComponent(JSON.stringify(symbols));
      const url = `${REST_BASE}/api/v3/ticker/24hr?symbols=${param}`;
      const raw = (await fetchJson(url)) as Binance24h[];
      if (Array.isArray(raw) && raw.length) {
        const tickers: Ticker[] = raw.map((t) => ({
          symbol: t.symbol,
          price: Number(t.lastPrice),
          changePct24h: Number(t.priceChangePercent),
          high24h: Number(t.highPrice),
          low24h: Number(t.lowPrice),
          volume24h: Number(t.quoteVolume),
        }));
        return { tickers, source: "live" };
      }
    } catch {
      // fall through
    }
  }
  return { tickers: symbols.map((s) => syntheticTicker(s)), source: "synthetic" };
}
