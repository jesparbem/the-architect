import { cn } from "@/lib/utils";
import { formatUsd, formatPct } from "@/lib/format";

interface PnlBadgeProps {
  value: number; // absolute PnL (USD)
  pct?: number; // optional percentage
  className?: string;
  /** "usd" shows currency, "pct" shows percentage, "both" shows usd (pct). */
  mode?: "usd" | "pct" | "both";
}

/**
 * Direction is NEVER encoded by color alone — always paired with a sign and
 * an arrow, so it stays legible for colorblind users.
 */
export function PnlBadge({ value, pct, className, mode = "usd" }: PnlBadgeProps) {
  const positive = value > 0;
  const negative = value < 0;
  const arrow = positive ? "▲" : negative ? "▼" : "—";
  const color = positive ? "text-up" : negative ? "text-down" : "text-muted";
  const sign = positive ? "+" : "";

  let text: string;
  if (mode === "pct") text = formatPct(pct ?? 0, { sign: true });
  else if (mode === "both") text = `${sign}${formatUsd(value)} (${formatPct(pct ?? 0, { sign: true })})`;
  else text = `${sign}${formatUsd(value)}`;

  return (
    <span className={cn("tnum inline-flex items-center gap-1 font-medium", color, className)}>
      <span aria-hidden className="text-[0.7em]">{arrow}</span>
      {text}
    </span>
  );
}
