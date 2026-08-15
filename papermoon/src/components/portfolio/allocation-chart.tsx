"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import Decimal from "decimal.js";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { usePriceStore } from "@/stores/price-store";
import { getSymbolInfo } from "@/lib/market/symbols";
import { formatUsd } from "@/lib/format";

const COLORS = ["#5b8def", "#16c784", "#f0a020", "#a855f7", "#ec4899", "#06b6d4", "#f97316", "#84cc16"];
const CASH_COLOR = "#848e9c";

export function AllocationChart() {
  const cash = usePortfolioStore((s) => s.cash);
  const positions = usePortfolioStore((s) => s.positions);
  const prices = usePriceStore((s) => s.prices);

  const data = useMemo(() => {
    const slices = [{ name: "Efectivo", value: new Decimal(cash).toNumber(), color: CASH_COLOR }];
    positions.forEach((p, i) => {
      const price = prices[p.symbol]?.price ?? 0;
      const value = new Decimal(p.quantity).mul(price).toNumber();
      if (value > 0) {
        slices.push({
          name: getSymbolInfo(p.symbol)?.base ?? p.symbol,
          value,
          color: COLORS[i % COLORS.length],
        });
      }
    });
    return slices;
  }, [cash, positions, prices]);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-2 text-sm font-medium text-muted">Distribución</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2} stroke="none">
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatUsd(value)}
              contentStyle={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                color: "var(--color-text)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
            <span className="text-muted">{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
