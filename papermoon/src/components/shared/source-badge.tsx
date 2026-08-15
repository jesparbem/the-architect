"use client";

import { usePriceStore } from "@/stores/price-store";
import { cn } from "@/lib/utils";

/** Shows whether prices are coming from the live exchange feed or the demo feed. */
export function SourceBadge({ className }: { className?: string }) {
  const source = usePriceStore((s) => s.source);

  const config = {
    live: { label: "EN VIVO", dot: "bg-up", text: "text-up", pulse: true },
    synthetic: { label: "DEMO", dot: "bg-warning", text: "text-warning", pulse: false },
    connecting: { label: "CONECTANDO", dot: "bg-muted", text: "text-muted", pulse: true },
  }[source];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-medium tracking-wide",
        config.text,
        className,
      )}
      title={
        source === "synthetic"
          ? "Feed simulado (el exchange no es accesible desde esta red). En tu máquina verás datos reales."
          : source === "live"
            ? "Datos de mercado reales en vivo desde Binance"
            : "Conectando al feed de mercado…"
      }
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot, config.pulse && "animate-pulse")} />
      {config.label}
    </span>
  );
}
