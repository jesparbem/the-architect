// Browser-side live price stream. Connects directly to Binance's public
// combined WebSocket (no API key, no server needed — works on serverless hosts).
// If the socket can't connect (restricted network / geo-block), it transparently
// falls back to a synthetic in-browser tick generator so prices keep moving.

import { SyntheticLiveFeed } from "./synthetic";
import { SYMBOLS } from "./symbols";

const WS_BASE = process.env.NEXT_PUBLIC_BINANCE_WS_URL || "wss://stream.binance.com:9443";
const FORCE_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const CONNECT_TIMEOUT_MS = 4000;

export type StreamSource = "connecting" | "live" | "synthetic";

type TickListener = (symbol: string, price: number) => void;
type SourceListener = (source: StreamSource) => void;

class PriceStream {
  private ws: WebSocket | null = null;
  private synthTimer: ReturnType<typeof setInterval> | null = null;
  private connectTimer: ReturnType<typeof setTimeout> | null = null;
  private synth = new SyntheticLiveFeed();
  private tickListeners = new Set<TickListener>();
  private sourceListeners = new Set<SourceListener>();
  private started = false;
  private source: StreamSource = "connecting";

  private readonly symbols = SYMBOLS.map((s) => s.symbol);

  start(): void {
    if (this.started || typeof window === "undefined") return;
    this.started = true;
    if (FORCE_DEMO) {
      this.startSynthetic();
      return;
    }
    this.connectLive();
  }

  private setSource(s: StreamSource) {
    if (this.source === s) return;
    this.source = s;
    this.sourceListeners.forEach((l) => l(s));
  }

  private connectLive() {
    try {
      const streams = this.symbols.map((s) => `${s.toLowerCase()}@ticker`).join("/");
      const ws = new WebSocket(`${WS_BASE}/stream?streams=${streams}`);
      this.ws = ws;

      this.connectTimer = setTimeout(() => {
        if (this.source !== "live") {
          try { ws.close(); } catch { /* noop */ }
          this.startSynthetic();
        }
      }, CONNECT_TIMEOUT_MS);

      ws.onopen = () => this.setSource("live");
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string);
          const data = msg?.data;
          if (data?.s && data?.c) this.emit(String(data.s), Number(data.c));
        } catch { /* ignore malformed frame */ }
      };
      ws.onerror = () => {
        if (this.source !== "live") this.startSynthetic();
      };
      ws.onclose = () => {
        if (this.source === "live") {
          // Lost a working connection — fall back rather than go stale.
          this.startSynthetic();
        }
      };
    } catch {
      this.startSynthetic();
    }
  }

  private startSynthetic() {
    if (this.connectTimer) clearTimeout(this.connectTimer);
    if (this.ws) { try { this.ws.close(); } catch { /* noop */ } this.ws = null; }
    if (this.synthTimer) return; // already running
    this.setSource("synthetic");
    // Seed once immediately, then tick.
    this.symbols.forEach((s) => this.emit(s, this.synth.priceOf(s)));
    this.synthTimer = setInterval(() => {
      this.symbols.forEach((s) => this.emit(s, this.synth.next(s)));
    }, 1000);
  }

  private emit(symbol: string, price: number) {
    if (!Number.isFinite(price)) return;
    this.tickListeners.forEach((l) => l(symbol, price));
  }

  onTick(cb: TickListener): () => void {
    this.tickListeners.add(cb);
    return () => this.tickListeners.delete(cb);
  }

  onSource(cb: SourceListener): () => void {
    this.sourceListeners.add(cb);
    cb(this.source);
    return () => this.sourceListeners.delete(cb);
  }

  getSource(): StreamSource {
    return this.source;
  }
}

// Module singleton — survives React StrictMode double mounts.
export const priceStream = new PriceStream();
