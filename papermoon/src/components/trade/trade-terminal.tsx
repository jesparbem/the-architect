"use client";

import { useState } from "react";
import { PriceChart } from "./price-chart";
import { TimeframeSelector } from "./timeframe-selector";
import { OrderTicket } from "./order-ticket";
import { PositionCard } from "./position-card";
import { LiveNumber } from "@/components/shared/live-number";
import { PnlBadge } from "@/components/shared/pnl-badge";
import { usePrice } from "@/stores/price-store";
import { useTicker } from "@/hooks/use-tickers";
import { getSymbolInfo } from "@/lib/market/symbols";
import { formatUsd } from "@/lib/format";

export function TradeTerminal({ symbol }: { symbol: string }) {
  const [interval, setInterval] = useState("1h");
  const info = getSymbolInfo(symbol);
  const live = usePrice(symbol);
  const ticker = useTicker(symbol);
  const price = live?.price ?? ticker?.price ?? 0;

  return (
    <div className="space-y-4">
      {/* Symbol header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{info?.name ?? symbol}</h1>
              <span className="text-sm text-muted">{symbol}</span>
            </div>
            <LiveNumber value={price} className="text-2xl font-semibold" prefix="$" />
          </div>
          {ticker && <PnlBadge value={ticker.changePct24h} pct={ticker.changePct24h} mode="pct" />}
        </div>
        {ticker && (
          <dl className="flex gap-6 text-xs text-muted">
            <div>
              <dt>Máx 24h</dt>
              <dd className="tnum text-text">{formatUsd(ticker.high24h)}</dd>
            </div>
            <div>
              <dt>Mín 24h</dt>
              <dd className="tnum text-text">{formatUsd(ticker.low24h)}</dd>
            </div>
            <div>
              <dt>Vol 24h</dt>
              <dd className="tnum text-text">{formatUsd(ticker.volume24h)}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 rounded-xl border border-border bg-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-muted">Gráfico</span>
            <TimeframeSelector value={interval} onChange={setInterval} />
          </div>
          <PriceChart symbol={symbol} interval={interval} />
        </div>

        <div className="space-y-4">
          <OrderTicket symbol={symbol} />
          <PositionCard symbol={symbol} />
        </div>
      </div>
    </div>
  );
}
