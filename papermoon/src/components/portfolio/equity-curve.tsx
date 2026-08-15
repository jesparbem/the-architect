"use client";

import { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip, XAxis } from "recharts";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { usePortfolioValue } from "@/hooks/use-portfolio-value";
import { formatUsd } from "@/lib/format";

export function EquityCurve() {
  const history = usePortfolioStore((s) => s.equityHistory);
  const startingBalance = usePortfolioStore((s) => s.startingBalance);
  const createdAt = usePortfolioStore((s) => s.createdAt);
  const { equity } = usePortfolioValue();

  const data = useMemo(() => {
    const points = [{ ts: createdAt, equity: startingBalance }, ...history];
    // Always show the live current equity as the final point.
    points.push({ ts: Date.now(), equity });
    return points.map((p) => ({
      ts: p.ts,
      equity: p.equity,
      label: new Date(p.ts).toLocaleString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
    }));
  }, [history, equity, startingBalance, createdAt]);

  const up = equity >= startingBalance;
  const color = up ? "#16c784" : "#ea3943";

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-2 text-sm font-medium text-muted">Evolución del equity</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" hide />
            <YAxis domain={["auto", "auto"]} hide />
            <Tooltip
              formatter={(value: number) => formatUsd(value)}
              labelFormatter={(l) => String(l)}
              contentStyle={{
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                color: "var(--color-text)",
              }}
            />
            <Area type="monotone" dataKey="equity" stroke={color} strokeWidth={2} fill="url(#equityFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
