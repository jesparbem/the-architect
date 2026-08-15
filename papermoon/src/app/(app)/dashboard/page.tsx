"use client";

import { StatCards } from "@/components/portfolio/stat-cards";
import { EquityCurve } from "@/components/portfolio/equity-curve";
import { AllocationChart } from "@/components/portfolio/allocation-chart";
import { PositionsTable } from "@/components/portfolio/positions-table";
import { ActivityList } from "@/components/portfolio/activity-list";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrated } from "@/hooks/use-hydrated";

export default function DashboardPage() {
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <StatCards />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EquityCurve />
        </div>
        <AllocationChart />
      </div>
      <div>
        <h2 className="mb-2 text-sm font-medium text-muted">Posiciones abiertas</h2>
        <PositionsTable />
      </div>
      <div>
        <h2 className="mb-2 text-sm font-medium text-muted">Actividad reciente</h2>
        <ActivityList limit={6} />
      </div>
    </div>
  );
}
