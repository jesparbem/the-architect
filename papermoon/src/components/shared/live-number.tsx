"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";

interface LiveNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  className?: string;
  /** Flash background on change (default true). */
  flash?: boolean;
}

/** A number that briefly flashes green/red when it moves. */
export function LiveNumber({ value, decimals, prefix = "", className, flash = true }: LiveNumberProps) {
  const prev = useRef(value);
  const [dir, setDir] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (value > prev.current) setDir("up");
    else if (value < prev.current) setDir("down");
    prev.current = value;
    if (!flash) return;
    const t = setTimeout(() => setDir(null), 500);
    return () => clearTimeout(t);
  }, [value, flash]);

  return (
    <span
      className={cn(
        "tnum rounded px-1",
        flash && dir === "up" && "flash-up",
        flash && dir === "down" && "flash-down",
        className,
      )}
    >
      {prefix}
      {formatPrice(value, decimals !== undefined ? { decimals } : undefined)}
    </span>
  );
}
