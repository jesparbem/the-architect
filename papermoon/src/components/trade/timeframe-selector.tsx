"use client";

import { cn } from "@/lib/utils";

const INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"];

export function TimeframeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {INTERVALS.map((iv) => (
        <button
          key={iv}
          onClick={() => onChange(iv)}
          className={cn(
            "rounded px-2 py-1 text-xs font-medium transition-colors",
            value === iv ? "bg-surface-2 text-text" : "text-muted hover:text-text",
          )}
        >
          {iv}
        </button>
      ))}
    </div>
  );
}
