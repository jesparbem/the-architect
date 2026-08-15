"use client";

import { usePortfolioStore } from "@/stores/portfolio-store";
import { Badge } from "@/components/ui/badge";
import { PnlBadge } from "@/components/shared/pnl-badge";
import { formatQty, formatUsd } from "@/lib/format";
import { getSymbolInfo } from "@/lib/market/symbols";

function timeAgo(ts: number): string {
  return new Date(ts).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityList({ limit }: { limit?: number }) {
  const trades = usePortfolioStore((s) => s.trades);
  const shown = limit ? trades.slice(0, limit) : trades;

  if (shown.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
        Aún no hay operaciones. Tus trades aparecerán aquí.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60 rounded-xl border border-border bg-surface">
      {shown.map((t) => {
        const base = getSymbolInfo(t.symbol)?.base ?? t.symbol.replace("USDT", "");
        return (
          <div key={t.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <div className="flex items-center gap-3">
              <Badge variant={t.side === "buy" ? "up" : "down"}>
                {t.side === "buy" ? "Compra" : "Venta"}
              </Badge>
              <div>
                <div className="font-medium">{base}</div>
                <div className="text-xs text-muted">{timeAgo(t.createdAt)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="tnum">{formatQty(t.quantity)} @ {formatUsd(t.price)}</div>
              {t.realizedPnl !== null && (
                <div className="text-xs">
                  PnL: <PnlBadge value={Number(t.realizedPnl)} mode="usd" className="text-xs" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
