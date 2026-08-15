"use client";

import { StatCards } from "@/components/portfolio/stat-cards";
import { EquityCurve } from "@/components/portfolio/equity-curve";
import { PositionsTable } from "@/components/portfolio/positions-table";
import { ResetButton } from "@/components/portfolio/reset-button";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";

export default function PortfolioPage() {
  const hydrated = useHydrated();

  if (!hydrated) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Cartera</h1>
        <ResetButton />
      </div>
      <StatCards />
      <EquityCurve />
      <div>
        <h2 className="mb-2 text-sm font-medium text-muted">Posiciones</h2>
        <PositionsTable />
      </div>
    </div>
  );
}
