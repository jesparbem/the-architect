"use client";

import { useState } from "react";
import { toast } from "sonner";
import Decimal from "decimal.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePrice } from "@/stores/price-store";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { estimateBuyCost, estimateSellProceeds } from "@/lib/trading/engine";
import { FEE_RATE } from "@/lib/trading/fees";
import { formatUsd, formatQty, formatPrice } from "@/lib/format";
import { getSymbolInfo } from "@/lib/market/symbols";
import { cn } from "@/lib/utils";
import type { OrderSide } from "@/lib/types";
import type { FillError } from "@/lib/trading/engine";

const ERROR_MESSAGES: Record<FillError, string> = {
  insufficient_funds: "Fondos insuficientes",
  insufficient_position: "No tienes suficiente cantidad para vender",
  invalid_quantity: "Introduce una cantidad válida",
  invalid_price: "Precio de mercado no disponible",
};

export function OrderTicket({ symbol }: { symbol: string }) {
  const info = getSymbolInfo(symbol);
  const base = info?.base ?? symbol.replace("USDT", "");
  const price = usePrice(symbol)?.price ?? 0;
  const cash = usePortfolioStore((s) => s.cash);
  const position = usePortfolioStore((s) => s.positions.find((p) => p.symbol === symbol));
  const placeMarketOrder = usePortfolioStore((s) => s.placeMarketOrder);

  const [side, setSide] = useState<OrderSide>("buy");
  const [qty, setQty] = useState("");

  const held = position ? new Decimal(position.quantity) : new Decimal(0);
  const cashDec = new Decimal(cash);

  const setPercent = (pct: number) => {
    if (side === "buy") {
      if (price <= 0) return;
      const budget = cashDec.mul(pct).div(1 + FEE_RATE);
      setQty(budget.div(price).toDecimalPlaces(6, Decimal.ROUND_DOWN).toString());
    } else {
      setQty(held.mul(pct).toDecimalPlaces(6, Decimal.ROUND_DOWN).toString());
    }
  };

  const qtyValid = qty !== "" && Number(qty) > 0;
  const preview =
    qtyValid && price > 0
      ? side === "buy"
        ? estimateBuyCost(qty, String(price))
        : estimateSellProceeds(qty, String(price))
      : "0";

  const submit = () => {
    if (price <= 0) {
      toast.error("Precio de mercado no disponible todavía");
      return;
    }
    const res = placeMarketOrder({ symbol, side, quantity: qty, price: String(price) });
    if (res.ok) {
      toast.success(
        `${side === "buy" ? "Compra" : "Venta"} ejecutada: ${formatQty(qty)} ${base} @ ${formatUsd(price)}`,
      );
      setQty("");
    } else {
      toast.error(ERROR_MESSAGES[res.error ?? "invalid_quantity"]);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-surface">
      {/* Buy / Sell toggle */}
      <div className="grid grid-cols-2 gap-1 p-1">
        <button
          onClick={() => setSide("buy")}
          className={cn(
            "rounded-lg py-2 text-sm font-semibold transition-colors",
            side === "buy" ? "bg-up text-white" : "text-muted hover:text-text",
          )}
        >
          Comprar
        </button>
        <button
          onClick={() => setSide("sell")}
          className={cn(
            "rounded-lg py-2 text-sm font-semibold transition-colors",
            side === "sell" ? "bg-down text-white" : "text-muted hover:text-text",
          )}
        >
          Vender
        </button>
      </div>

      <div className="space-y-3 p-3">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Tipo</span>
          <span className="rounded bg-surface-2 px-2 py-0.5 text-text">Mercado</span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted">
          <span>Disponible</span>
          <span className="tnum text-text">
            {side === "buy" ? formatUsd(cash) : `${formatQty(held.toString())} ${base}`}
          </span>
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted">Cantidad ({base})</label>
          <Input
            inputMode="decimal"
            placeholder="0.00"
            value={qty}
            onChange={(e) => setQty(e.target.value.replace(/[^0-9.]/g, ""))}
            className="tnum"
          />
        </div>

        <div className="grid grid-cols-4 gap-1">
          {[0.25, 0.5, 0.75, 1].map((p) => (
            <Button key={p} variant="outline" size="sm" onClick={() => setPercent(p)} className="text-xs">
              {p * 100}%
            </Button>
          ))}
        </div>

        <div className="space-y-1 rounded-lg bg-surface-2 p-3 text-xs">
          <div className="flex justify-between">
            <span className="text-muted">Precio de mercado</span>
            <span className="tnum">{price > 0 ? formatUsd(price) : "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Comisión ({(FEE_RATE * 100).toFixed(1)}%)</span>
            <span className="tnum">
              {qtyValid && price > 0
                ? formatUsd(new Decimal(qty).mul(price).mul(FEE_RATE).toNumber())
                : "—"}
            </span>
          </div>
          <div className="flex justify-between font-medium text-text">
            <span>{side === "buy" ? "Coste total" : "Recibirás"}</span>
            <span className="tnum">{qtyValid ? formatUsd(preview) : "—"}</span>
          </div>
        </div>

        <Button
          variant={side === "buy" ? "up" : "down"}
          size="lg"
          className="w-full"
          disabled={!qtyValid || price <= 0}
          onClick={submit}
        >
          {side === "buy" ? "Comprar" : "Vender"} {base}
        </Button>
        <p className="text-center text-[11px] text-muted">
          Al precio de mercado real de {price > 0 ? formatPrice(price) : "—"} · fondos virtuales
        </p>
      </div>
    </div>
  );
}
