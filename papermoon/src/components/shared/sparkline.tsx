interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

/** Tiny inline SVG sparkline; color reflects first→last direction. */
export function Sparkline({ data, width = 80, height = 28, className }: SparklineProps) {
  if (!data || data.length < 2) {
    return <svg width={width} height={height} className={className} />;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 2) - 1;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const up = data[data.length - 1] >= data[0];
  const stroke = up ? "var(--color-up)" : "var(--color-down)";

  return (
    <svg width={width} height={height} className={className} preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
