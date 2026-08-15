import { NextRequest, NextResponse } from "next/server";
import { getTickers } from "@/lib/market/binance";
import { SYMBOLS } from "@/lib/market/symbols";
import { isKnownSymbol } from "@/lib/market/synthetic";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("symbols");
  const symbols = raw
    ? raw.split(",").map((s) => s.trim().toUpperCase()).filter(isKnownSymbol)
    : SYMBOLS.map((s) => s.symbol);

  if (symbols.length === 0) {
    return NextResponse.json({ error: "no_valid_symbols" }, { status: 400 });
  }

  const { tickers, source } = await getTickers(symbols);
  return NextResponse.json({ tickers, source });
}
