import { notFound } from "next/navigation";
import { TradeTerminal } from "@/components/trade/trade-terminal";
import { getSymbolInfo } from "@/lib/market/symbols";

export default async function TradePage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();
  if (!getSymbolInfo(upper)) notFound();
  return <TradeTerminal symbol={upper} />;
}
