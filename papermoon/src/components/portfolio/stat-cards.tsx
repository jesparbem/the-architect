"use client";

import { usePortfolioValue } from "@/hooks/use-portfolio-value";
import { PnlBadge } from "@/components/shared/pnl-badge";
import { formatUsd } from "@/lib/format";

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold tnum">{children}</div>
    </div>
  );
}

export function StatCards() {
  const { equity, cash, positionsValue, unrealizedPnl, totalReturn, totalReturnPct } = usePortfolioValue();

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Equity total">{formatUsd(equity)}</Stat>
      <Stat label="Efectivo disponible">{formatUsd(cash)}</Stat>
      <Stat label="Valor en posiciones">{formatUsd(positionsValue)}</Stat>
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="text-xs text-muted">Rendimiento total</div>
        <div className="mt-1 text-xl font-semibold">
          <PnlBadge value={totalReturn} pct={totalReturnPct} mode="both" />
        </div>
        <div className="mt-0.5 text-xs text-muted">
          PnL no realizado: <PnlBadge value={unrealizedPnl} mode="usd" className="text-xs" />
        </div>
      </div>
    </div>
  );
}
