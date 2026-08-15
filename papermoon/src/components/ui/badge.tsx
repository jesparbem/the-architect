import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "up" | "down" | "muted" | "warning";

const styles: Record<Variant, string> = {
  default: "border-primary/30 bg-primary/10 text-primary",
  up: "border-up/30 bg-up/10 text-up",
  down: "border-down/30 bg-down/10 text-down",
  muted: "border-border bg-surface-2 text-muted",
  warning: "border-warning/30 bg-warning/10 text-warning",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        styles[variant],
        className,
      )}
      {...props}
    />
  );
}
