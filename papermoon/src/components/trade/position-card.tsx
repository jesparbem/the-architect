"use client";

import { usePortfolioStore } from "@/stores/portfolio-store";
import { usePrice } from "@/stores/price-store";
import { unrealizedPnl, unrealizedPnlPct, positionValue } from "@/lib/trading/engine";
import { PnlBadge } from "@/components/shared/pnl-badge";
import { formatQty, formatUsd } from "@/lib/format";
import { getSymbolInfo } from "@/lib/market/symbols";

export function PositionCard({ symbol }: { symbol: string }) {
  const position = usePortfolioStore((s) => s.positions.find((p) => p.symbol === symbol));
  const price = usePrice(symbol)?.price ?? 0;
  const base = getSymbolInfo(symbol)?.base ?? symbol.replace("USDT", "");

  if (!position) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
        Sin posición en {base}. Coloca una orden para abrir una.
      </div>
    );
  }

  const value = positionValue(position, price);
  const pnl = unrealizedPnl(position, price);
  const pnlPct = unrealizedPnlPct(position, price);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted">Tu posición</h3>
        <PnlBadge value={pnl} pct={pnlPct} mode="both" className="text-xs" />
      </div>
      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-muted">Cantidad</dt>
        <dd className="tnum text-right">{formatQty(position.quantity)} {base}</dd>
        <dt className="text-muted">Precio medio</dt>
        <dd className="tnum text-right">{formatUsd(position.avgEntryPrice)}</dd>
        <dt className="text-muted">Precio actual</dt>
        <dd className="tnum text-right">{price > 0 ? formatUsd(price) : "—"}</dd>
        <dt className="text-muted">Valor de mercado</dt>
        <dd className="tnum text-right font-medium text-text">{formatUsd(value)}</dd>
      </dl>
    </div>
  );
}
