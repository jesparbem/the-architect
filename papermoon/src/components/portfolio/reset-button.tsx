"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { formatUsd } from "@/lib/format";
import { STARTING_BALANCE } from "@/lib/trading/fees";

export function ResetButton() {
  const reset = usePortfolioStore((s) => s.reset);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
        <RotateCcw className="h-4 w-4" />
        Reiniciar cartera
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">¿Volver a {formatUsd(STARTING_BALANCE)}?</span>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => {
          reset();
          setConfirming(false);
          toast.success(`Cartera reiniciada a ${formatUsd(STARTING_BALANCE)}`);
        }}
      >
        Sí, reiniciar
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancelar
      </Button>
    </div>
  );
}
