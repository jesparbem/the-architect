// Synthetic market-data generator used as a fallback when live exchange data
// is unreachable (restricted networks, offline demos). Produces plausible
// candlesticks, tickers, and a live-tick stream via a seeded random walk so the
// app is fully functional — and demoable — anywhere.

import type { Candle, Ticker } from "@/lib/types";
import { basePriceOf, getSymbolInfo, SYMBOLS } from "./symbols";

export const INTERVAL_SECONDS: Record<string, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
};

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 seeded PRNG → deterministic series per (symbol, interval). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generate `limit` candles ending at the current aligned bucket. */
export function syntheticCandles(symbol: string, interval: string, limit = 500): Candle[] {
  const stepSec = INTERVAL_SECONDS[interval] ?? 3600;
  const base = basePriceOf(symbol);
  const rand = mulberry32(hashString(`${symbol}:${interval}`));
  const vol = 0.012 + rand() * 0.01; // per-step volatility 1.2%–2.2%

  const nowSec = Math.floor(Date.now() / 1000);
  const lastBucket = nowSec - (nowSec % stepSec);
  const startBucket = lastBucket - stepSec * (limit - 1);

  const candles: Candle[] = [];
  // Start below base so the series trends toward the seed price.
  let price = base * (0.85 + rand() * 0.1);
  for (let i = 0; i < limit; i++) {
    const time = startBucket + i * stepSec;
    const drift = (base - price) * 0.02; // mild mean reversion toward base
    const shock = (rand() - 0.5) * 2 * vol * price;
    const open = price;
    const close = Math.max(price + drift + shock, base * 0.05);
    const high = Math.max(open, close) * (1 + rand() * vol * 0.6);
    const low = Math.min(open, close) * (1 - rand() * vol * 0.6);
    const volume = base * (500 + rand() * 1500);
    candles.push({ time, open, high, low, close, volume });
    price = close;
  }
  return candles;
}

export function syntheticTicker(symbol: string): Ticker {
  const dayCandles = syntheticCandles(symbol, "1h", 24);
  const first = dayCandles[0];
  const last = dayCandles[dayCandles.length - 1];
  const price = last.close;
  const changePct24h = ((price - first.open) / first.open) * 100;
  const high24h = Math.max(...dayCandles.map((c) => c.high));
  const low24h = Math.min(...dayCandles.map((c) => c.low));
  const volume24h = dayCandles.reduce((s, c) => s + c.volume, 0);
  return { symbol, price, changePct24h, high24h, low24h, volume24h };
}

export function syntheticTickers(): Ticker[] {
  return SYMBOLS.map((s) => syntheticTicker(s.symbol));
}

/**
 * A stateful synthetic live price source. `next()` returns the next tick for a
 * symbol as a bounded random walk anchored to its base price.
 */
export class SyntheticLiveFeed {
  private prices = new Map<string, number>();

  priceOf(symbol: string): number {
    let p = this.prices.get(symbol);
    if (p === undefined) {
      p = syntheticTicker(symbol).price;
      this.prices.set(symbol, p);
    }
    return p;
  }

  next(symbol: string): number {
    const base = basePriceOf(symbol);
    const cur = this.priceOf(symbol);
    const drift = (base - cur) * 0.01;
    const shock = (Math.random() - 0.5) * 0.004 * cur; // ~0.2% per tick
    const next = Math.max(cur + drift + shock, base * 0.05);
    this.prices.set(symbol, next);
    return next;
  }
}

export function isKnownSymbol(symbol: string): boolean {
  return !!getSymbolInfo(symbol);
}
