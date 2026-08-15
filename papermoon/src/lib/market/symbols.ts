import type { SymbolInfo } from "@/lib/types";

// Curated list of liquid USDT pairs. Base prices are only used to seed the
// synthetic feed when live data is unreachable; live mode ignores them.
interface Seed extends SymbolInfo {
  basePrice: number;
}

export const SYMBOLS: Seed[] = [
  { symbol: "BTCUSDT", base: "BTC", quote: "USDT", name: "Bitcoin", basePrice: 68000 },
  { symbol: "ETHUSDT", base: "ETH", quote: "USDT", name: "Ethereum", basePrice: 3500 },
  { symbol: "SOLUSDT", base: "SOL", quote: "USDT", name: "Solana", basePrice: 165 },
  { symbol: "BNBUSDT", base: "BNB", quote: "USDT", name: "BNB", basePrice: 600 },
  { symbol: "XRPUSDT", base: "XRP", quote: "USDT", name: "XRP", basePrice: 0.62 },
  { symbol: "ADAUSDT", base: "ADA", quote: "USDT", name: "Cardano", basePrice: 0.45 },
  { symbol: "DOGEUSDT", base: "DOGE", quote: "USDT", name: "Dogecoin", basePrice: 0.16 },
  { symbol: "AVAXUSDT", base: "AVAX", quote: "USDT", name: "Avalanche", basePrice: 38 },
  { symbol: "LINKUSDT", base: "LINK", quote: "USDT", name: "Chainlink", basePrice: 17 },
  { symbol: "DOTUSDT", base: "DOT", quote: "USDT", name: "Polkadot", basePrice: 7.2 },
  { symbol: "MATICUSDT", base: "MATIC", quote: "USDT", name: "Polygon", basePrice: 0.72 },
  { symbol: "LTCUSDT", base: "LTC", quote: "USDT", name: "Litecoin", basePrice: 85 },
  { symbol: "TRXUSDT", base: "TRX", quote: "USDT", name: "TRON", basePrice: 0.13 },
  { symbol: "ATOMUSDT", base: "ATOM", quote: "USDT", name: "Cosmos", basePrice: 9.5 },
  { symbol: "UNIUSDT", base: "UNI", quote: "USDT", name: "Uniswap", basePrice: 10.5 },
  { symbol: "NEARUSDT", base: "NEAR", quote: "USDT", name: "NEAR Protocol", basePrice: 6.1 },
  { symbol: "APTUSDT", base: "APT", quote: "USDT", name: "Aptos", basePrice: 9.8 },
  { symbol: "FILUSDT", base: "FIL", quote: "USDT", name: "Filecoin", basePrice: 5.4 },
  { symbol: "ARBUSDT", base: "ARB", quote: "USDT", name: "Arbitrum", basePrice: 1.1 },
  { symbol: "OPUSDT", base: "OP", quote: "USDT", name: "Optimism", basePrice: 2.3 },
];

const BY_SYMBOL = new Map(SYMBOLS.map((s) => [s.symbol, s]));

export function getSymbolInfo(symbol: string): Seed | undefined {
  return BY_SYMBOL.get(symbol.toUpperCase());
}

export function basePriceOf(symbol: string): number {
  return BY_SYMBOL.get(symbol.toUpperCase())?.basePrice ?? 100;
}

export const DEFAULT_SYMBOL = "BTCUSDT";
