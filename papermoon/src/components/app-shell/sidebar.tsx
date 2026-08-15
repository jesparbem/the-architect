"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LineChart, Wallet, ScrollText, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/markets", label: "Mercados", icon: LineChart },
  { href: "/portfolio", label: "Cartera", icon: Wallet },
  { href: "/orders", label: "Órdenes", icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <Link href="/dashboard" className="flex items-center gap-2 px-5 py-4 text-lg font-semibold">
        <Moon className="h-5 w-5 text-primary" fill="currentColor" />
        Paper<span className="text-primary">Moon</span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-surface-2 text-text" : "text-muted hover:bg-surface-2 hover:text-text",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 text-[11px] leading-relaxed text-muted">
        Simulador educativo. No es asesoramiento financiero. Fondos virtuales.
      </div>
    </aside>
  );
}
