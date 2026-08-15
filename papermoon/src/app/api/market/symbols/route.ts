import { NextResponse } from "next/server";
import { SYMBOLS } from "@/lib/market/symbols";

export async function GET() {
  const symbols = SYMBOLS.map(({ symbol, base, quote, name }) => ({ symbol, base, quote, name }));
  return NextResponse.json({ symbols });
}
