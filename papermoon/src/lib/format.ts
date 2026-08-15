// Number formatting helpers. All display numbers should flow through here so
// precision and grouping stay consistent across the app.

/** Choose sensible decimal places for a crypto price based on magnitude. */
function priceDecimals(value: number): number {
  const abs = Math.abs(value);
  if (abs >= 1000) return 2;
  if (abs >= 1) return 2;
  if (abs >= 0.01) return 4;
  if (abs >= 0.0001) return 6;
  return 8;
}

export function formatPrice(value: number | string, opts?: { decimals?: number }): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  const decimals = opts?.decimals ?? priceDecimals(n);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatUsd(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatQty(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  // Up to 8 significant decimals, trimmed.
  const s = n.toLocaleString("en-US", { maximumFractionDigits: 8 });
  return s;
}

export function formatPct(value: number | string, opts?: { sign?: boolean }): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  const sign = opts?.sign && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function formatCompact(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 });
}
