"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePortfolioValue } from "@/hooks/use-portfolio-value";
import { PnlBadge } from "@/components/shared/pnl-badge";
import { SourceBadge } from "@/components/shared/source-badge";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

const MOBILE_NAV = [
  { href: "/dashboard", label: "Panel" },
  { href: "/markets", label: "Mercados" },
  { href: "/portfolio", label: "Cartera" },
  { href: "/orders", label: "Órdenes" },
];

export function Topbar() {
  const { equity, totalReturn, totalReturnPct } = usePortfolioValue();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 flex flex-col gap-2 border-b border-border bg-background/80 px-4 py-2.5 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm font-semibold md:hidden">
          Paper<span className="text-primary">Moon</span>
        </Link>
        <nav className="flex items-center gap-1 md:hidden">
          {MOBILE_NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded px-2 py-1 text-xs",
                pathname.startsWith(n.href) ? "bg-surface-2 text-text" : "text-muted",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        <SourceBadge />
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">Equity</span>
          <span className="tnum font-semibold">{formatUsd(equity)}</span>
          <PnlBadge value={totalReturn} pct={totalReturnPct} mode="both" className="text-xs" />
        </div>
      </div>
    </header>
  );
}
