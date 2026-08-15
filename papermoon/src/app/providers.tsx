"use client";

import { useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { priceStream } from "@/lib/market/stream";
import { usePriceStore } from "@/stores/price-store";
import { usePortfolioStore } from "@/stores/portfolio-store";
import { totalEquity } from "@/lib/trading/engine";

/** Starts the live price stream once and pipes ticks into the price store. */
function PriceStreamController() {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;

    priceStream.start();
    const unTick = priceStream.onTick((symbol, price) => {
      usePriceStore.getState().setPrice(symbol, price);
    });
    const unSrc = priceStream.onSource((source) => {
      usePriceStore.getState().setSource(source);
    });

    // Snapshot equity periodically for the equity curve.
    const interval = setInterval(() => {
      const { cash, positions, recordEquity } = usePortfolioStore.getState();
      const prices = usePriceStore.getState().prices;
      const equity = totalEquity(cash, positions, (s) => prices[s]?.price ?? 0);
      if (equity > 0) recordEquity(equity);
    }, 15_000);

    return () => {
      unTick();
      unSrc();
      clearInterval(interval);
    };
  }, []);

  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
      }),
  );

  return (
    <QueryClientProvider client={client}>
      <PriceStreamController />
      {children}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          },
        }}
      />
    </QueryClientProvider>
  );
}
