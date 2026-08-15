"use client";

import { useMemo } from "react";
import Decimal from "decimal.js";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { usePriceStore } from "@/stores/price-store";

export interface PortfolioValue {
  cash: number;
  positionsValue: number;
  equity: number;
  unrealizedPnl: number;
  totalReturn: number;
  totalReturnPct: number;
}

/** Live portfolio valuation: positions marked to current prices. */
export function usePortfolioValue(): PortfolioValue {
  const cash = usePortfolioStore((s) => s.cash);
  const positions = usePortfolioStore((s) => s.positions);
  const startingBalance = usePortfolioStore((s) => s.startingBalance);
  const prices = usePriceStore((s) => s.prices);

  return useMemo(() => {
    let positionsValue = new Decimal(0);
    let unrealized = new Decimal(0);
    for (const p of positions) {
      const price = prices[p.symbol]?.price ?? 0;
      const qty = new Decimal(p.quantity);
      positionsValue = positionsValue.plus(qty.mul(price));
      unrealized = unrealized.plus(new Decimal(price).minus(p.avgEntryPrice).mul(qty));
    }
    const equity = new Decimal(cash).plus(positionsValue);
    const totalReturn = equity.minus(startingBalance);
    const totalReturnPct = startingBalance > 0 ? totalReturn.div(startingBalance).mul(100) : new Decimal(0);
    return {
      cash: new Decimal(cash).toNumber(),
      positionsValue: positionsValue.toNumber(),
      equity: equity.toNumber(),
      unrealizedPnl: unrealized.toNumber(),
      totalReturn: totalReturn.toNumber(),
      totalReturnPct: totalReturnPct.toNumber(),
    };
  }, [cash, positions, startingBalance, prices]);
}
