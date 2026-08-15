"use client";

import Link from "next/link";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { usePrice } from "@/stores/price-store";
import { unrealizedPnl, unrealizedPnlPct, positionValue } from "@/lib/trading/engine";
import { PnlBadge } from "@/components/shared/pnl-badge";
import { LiveNumber } from "@/components/shared/live-number";
import { formatQty, formatUsd } from "@/lib/format";
import { getSymbolInfo } from "@/lib/market/symbols";
import type { Position } from "@/lib/types";

function PositionRow({ position }: { position: Position }) {
  const price = usePrice(position.symbol)?.price ?? 0;
  const base = getSymbolInfo(position.symbol)?.base ?? position.symbol.replace("USDT", "");
  const value = positionValue(position, price);
  const pnl = unrealizedPnl(position, price);
  const pnlPct = unrealizedPnlPct(position, price);

  return (
    <tr className="border-b border-border/60 hover:bg-surface-2">
      <td className="py-3 pl-4">
        <Link href={`/trade/${position.symbol}`} className="font-medium hover:text-primary">
          {base}
        </Link>
        <div className="text-xs text-muted">{formatQty(position.quantity)} unidades</div>
      </td>
      <td className="py-3 text-right tnum text-sm">{formatUsd(position.avgEntryPrice)}</td>
      <td className="py-3 text-right">
        <LiveNumber value={price} prefix="$" className="text-sm" />
      </td>
      <td className="py-3 text-right tnum text-sm">{formatUsd(value)}</td>
      <td className="py-3 pr-4 text-right">
        <PnlBadge value={pnl} pct={pnlPct} mode="both" className="text-sm" />
      </td>
    </tr>
  );
}

export function PositionsTable() {
  const positions = usePortfolioStore((s) => s.positions);

  if (positions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
        No tienes posiciones abiertas.{" "}
        <Link href="/markets" className="text-primary hover:underline">
          Explora los mercados
        </Link>{" "}
        para empezar a operar.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th className="py-2 pl-4 text-left font-medium">Activo</th>
            <th className="py-2 text-right font-medium">Precio medio</th>
            <th className="py-2 text-right font-medium">Precio actual</th>
            <th className="py-2 text-right font-medium">Valor</th>
            <th className="py-2 pr-4 text-right font-medium">PnL no realizado</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <PositionRow key={p.symbol} position={p} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
