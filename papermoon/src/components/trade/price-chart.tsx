"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type CandlestickData,
} from "lightweight-charts";
import { useKlines } from "@/hooks/use-klines";
import { usePrice } from "@/stores/price-store";
import { Skeleton } from "@/components/ui/skeleton";

interface PriceChartProps {
  symbol: string;
  interval: string;
}

export function PriceChart({ symbol, interval }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const lastCandleRef = useRef<CandlestickData | null>(null);

  const { data, isLoading } = useKlines(symbol, interval);
  const live = usePrice(symbol);

  // Create the chart once.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#848e9c",
        fontFamily: "var(--font-mono)",
      },
      grid: {
        vertLines: { color: "rgba(42,47,58,0.4)" },
        horzLines: { color: "rgba(42,47,58,0.4)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#2a2f3a" },
      timeScale: { borderColor: "#2a2f3a", timeVisible: true, secondsVisible: false },
    });

    const candle = chart.addCandlestickSeries({
      upColor: "#16c784",
      downColor: "#ea3943",
      borderUpColor: "#16c784",
      borderDownColor: "#ea3943",
      wickUpColor: "#16c784",
      wickDownColor: "#ea3943",
    });
    const volume = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
      color: "rgba(91,141,239,0.4)",
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

    chartRef.current = chart;
    candleRef.current = candle;
    volumeRef.current = volume;

    const ro = new ResizeObserver(() => {
      chart.applyOptions({ width: el.clientWidth, height: el.clientHeight });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
    };
  }, []);

  // Load candle data when it changes.
  useEffect(() => {
    if (!data || !candleRef.current || !volumeRef.current) return;
    const candles = data.candles;
    candleRef.current.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    volumeRef.current.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? "rgba(22,199,132,0.4)" : "rgba(234,57,67,0.4)",
      })),
    );
    lastCandleRef.current = candles.length
      ? {
          time: candles[candles.length - 1].time as UTCTimestamp,
          open: candles[candles.length - 1].open,
          high: candles[candles.length - 1].high,
          low: candles[candles.length - 1].low,
          close: candles[candles.length - 1].close,
        }
      : null;
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  // Live-update the forming candle as prices tick in.
  useEffect(() => {
    const price = live?.price;
    const last = lastCandleRef.current;
    if (!price || !last || !candleRef.current) return;
    const updated: CandlestickData = {
      time: last.time,
      open: last.open,
      high: Math.max(last.high, price),
      low: Math.min(last.low, price),
      close: price,
    };
    lastCandleRef.current = updated;
    candleRef.current.update(updated);
  }, [live?.price]);

  return (
    <div className="relative h-[420px] w-full">
      {isLoading && <Skeleton className="absolute inset-0" />}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
