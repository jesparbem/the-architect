import { NextRequest, NextResponse } from "next/server";
import { getKlines } from "@/lib/market/binance";
import { INTERVAL_SECONDS } from "@/lib/market/synthetic";
import { isKnownSymbol } from "@/lib/market/synthetic";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") || "").toUpperCase();
  const interval = searchParams.get("interval") || "1h";
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || "400"), 10), 1000);

  if (!isKnownSymbol(symbol)) {
    return NextResponse.json({ error: "unknown_symbol" }, { status: 400 });
  }
  if (!INTERVAL_SECONDS[interval]) {
    return NextResponse.json({ error: "invalid_interval" }, { status: 400 });
  }

  const { candles, source } = await getKlines(symbol, interval, limit);
  return NextResponse.json({ candles, source });
}
