// Shared domain types for PaperMoon.

export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit";
export type OrderStatus = "pending" | "filled" | "cancelled" | "rejected";

export interface Candle {
  /** Unix time in SECONDS (lightweight-charts convention). */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Ticker {
  symbol: string;
  price: number;
  changePct24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

export interface SymbolInfo {
  symbol: string; // e.g. "BTCUSDT"
  base: string; // e.g. "BTC"
  quote: string; // e.g. "USDT"
  name: string; // human name, e.g. "Bitcoin"
}

/** A position stored as strings to preserve decimal precision. */
export interface Position {
  symbol: string;
  quantity: string; // decimal string
  avgEntryPrice: string; // decimal string
}

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  status: OrderStatus;
  quantity: string; // decimal string
  limitPrice: string | null;
  fillPrice: string | null;
  fee: string;
  rejectReason: string | null;
  createdAt: number; // epoch ms
  filledAt: number | null;
}

export interface Trade {
  id: string;
  orderId: string;
  symbol: string;
  side: OrderSide;
  quantity: string;
  price: string;
  fee: string;
  realizedPnl: string | null;
  createdAt: number;
}

export interface EquityPoint {
  ts: number; // epoch ms
  equity: number;
}
