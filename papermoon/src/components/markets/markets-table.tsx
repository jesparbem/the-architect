"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTickers } from "@/hooks/use-tickers";
import { usePrice } from "@/stores/price-store";
import { LiveNumber } from "@/components/shared/live-number";
import { PnlBadge } from "@/components/shared/pnl-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getSymbolInfo } from "@/lib/market/symbols";
import { formatUsd } from "@/lib/format";
import type { Ticker } from "@/lib/types";

function MarketRow({ ticker }: { ticker: Ticker }) {
  const router = useRouter();
  const info = getSymbolInfo(ticker.symbol);
  const live = usePrice(ticker.symbol);
  const price = live?.price ?? ticker.price;

  return (
    <tr
      className="cursor-pointer border-b border-border/60 transition-colors hover:bg-surface-2"
      onClick={() => router.push(`/trade/${ticker.symbol}`)}
    >
      <td className="py-3 pl-4">
        <div className="font-medium">{info?.name ?? ticker.symbol}</div>
        <div className="text-xs text-muted">{ticker.symbol}</div>
      </td>
      <td className="py-3 text-right">
        <LiveNumber value={price} prefix="$" className="text-sm" />
      </td>
      <td className="py-3 text-right">
        <PnlBadge value={ticker.changePct24h} pct={ticker.changePct24h} mode="pct" className="text-sm" />
      </td>
      <td className="hidden py-3 text-right tnum text-sm text-muted sm:table-cell">
        {formatUsd(ticker.volume24h)}
      </td>
      <td className="py-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
        <Link href={`/trade/${ticker.symbol}`}>
          <Button size="sm" variant="outline">Operar</Button>
        </Link>
      </td>
    </tr>
  );
}

export function MarketsTable() {
  const { data, isLoading } = useTickers();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const list = data?.tickers ?? [];
    const q = query.trim().toUpperCase();
    const filtered = q
      ? list.filter(
          (t) => t.symbol.includes(q) || (getSymbolInfo(t.symbol)?.name.toUpperCase().includes(q) ?? false),
        )
      : list;
    return [...filtered].sort((a, b) => b.volume24h - a.volume24h);
  }, [data, query]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Mercados</h1>
        <Input
          placeholder="Buscar (BTC, Ethereum…)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="py-2 pl-4 text-left font-medium">Activo</th>
              <th className="py-2 text-right font-medium">Precio</th>
              <th className="py-2 text-right font-medium">24h</th>
              <th className="hidden py-2 text-right font-medium sm:table-cell">Volumen 24h</th>
              <th className="py-2 pr-4 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-border/60">
                  <td className="py-3 pl-4"><Skeleton className="h-8 w-32" /></td>
                  <td className="py-3"><Skeleton className="ml-auto h-4 w-20" /></td>
                  <td className="py-3"><Skeleton className="ml-auto h-4 w-16" /></td>
                  <td className="hidden py-3 sm:table-cell"><Skeleton className="ml-auto h-4 w-20" /></td>
                  <td className="py-3 pr-4"><Skeleton className="ml-auto h-8 w-16" /></td>
                </tr>
              ))}
            {rows.map((t) => (
              <MarketRow key={t.symbol} ticker={t} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
