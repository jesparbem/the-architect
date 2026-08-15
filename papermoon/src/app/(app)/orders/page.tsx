"use client";

import { usePortfolioStore } from "@/stores/portfolio-store";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatQty, formatUsd } from "@/lib/format";
import { getSymbolInfo } from "@/lib/market/symbols";
import type { OrderStatus } from "@/lib/types";

const STATUS_LABEL: Record<OrderStatus, { label: string; variant: "up" | "down" | "muted" | "warning" }> = {
  filled: { label: "Ejecutada", variant: "up" },
  rejected: { label: "Rechazada", variant: "down" },
  cancelled: { label: "Cancelada", variant: "muted" },
  pending: { label: "Pendiente", variant: "warning" },
};

export default function OrdersPage() {
  const hydrated = useHydrated();
  const orders = usePortfolioStore((s) => s.orders);

  if (!hydrated) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Órdenes</h1>
      {orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
          No has colocado ninguna orden todavía.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pl-4 text-left font-medium">Fecha</th>
                <th className="py-2 text-left font-medium">Activo</th>
                <th className="py-2 text-left font-medium">Lado</th>
                <th className="py-2 text-right font-medium">Cantidad</th>
                <th className="py-2 text-right font-medium">Precio</th>
                <th className="py-2 pr-4 text-right font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const base = getSymbolInfo(o.symbol)?.base ?? o.symbol.replace("USDT", "");
                const status = STATUS_LABEL[o.status];
                return (
                  <tr key={o.id} className="border-b border-border/60">
                    <td className="py-3 pl-4 text-xs text-muted">
                      {new Date(o.createdAt).toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 font-medium">{base}</td>
                    <td className="py-3">
                      <Badge variant={o.side === "buy" ? "up" : "down"}>
                        {o.side === "buy" ? "Compra" : "Venta"}
                      </Badge>
                    </td>
                    <td className="py-3 text-right tnum">{formatQty(o.quantity)}</td>
                    <td className="py-3 text-right tnum">
                      {o.fillPrice ? formatUsd(o.fillPrice) : o.limitPrice ? formatUsd(o.limitPrice) : "—"}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
