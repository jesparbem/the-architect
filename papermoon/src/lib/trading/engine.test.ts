import { describe, it, expect } from "vitest";
import { applyFill, type EngineState } from "./engine";
import { FEE_RATE } from "./fees";

const fresh: EngineState = { cash: "100000", positions: [] };

describe("applyFill — buys", () => {
  it("opens a position and deducts cash + fee", () => {
    const r = applyFill(fresh, { symbol: "BTCUSDT", side: "buy", quantity: "1", price: "50000" });
    expect(r.ok).toBe(true);
    // cost = 50000 + fee(50) = 50050
    expect(Number(r.cash)).toBeCloseTo(100000 - 50000 * (1 + FEE_RATE), 6);
    expect(r.positions).toHaveLength(1);
    expect(r.positions[0]).toMatchObject({ symbol: "BTCUSDT", quantity: "1", avgEntryPrice: "50000" });
  });

  it("computes weighted average cost across two buys", () => {
    const funded: EngineState = { cash: "1000000", positions: [] };
    const r1 = applyFill(funded, { symbol: "BTCUSDT", side: "buy", quantity: "1", price: "50000" });
    const r2 = applyFill({ cash: r1.cash, positions: r1.positions }, {
      symbol: "BTCUSDT", side: "buy", quantity: "1", price: "60000",
    });
    expect(r2.ok).toBe(true);
    expect(Number(r2.positions[0].quantity)).toBe(2);
    expect(Number(r2.positions[0].avgEntryPrice)).toBeCloseTo(55000, 6); // (50000+60000)/2
  });

  it("rejects when funds are insufficient", () => {
    const r = applyFill(fresh, { symbol: "BTCUSDT", side: "buy", quantity: "10", price: "50000" });
    expect(r.ok).toBe(false);
    expect(r.error).toBe("insufficient_funds");
    expect(r.cash).toBe("100000"); // unchanged
  });
});

describe("applyFill — sells", () => {
  it("realizes PnL correctly on a profitable sell", () => {
    const bought = applyFill(fresh, { symbol: "BTCUSDT", side: "buy", quantity: "1", price: "50000" });
    const sold = applyFill({ cash: bought.cash, positions: bought.positions }, {
      symbol: "BTCUSDT", side: "sell", quantity: "1", price: "60000",
    });
    expect(sold.ok).toBe(true);
    // realized = (60000 - 50000) * 1 - fee(60) = 10000 - 60 = 9940
    expect(Number(sold.realizedPnl)).toBeCloseTo(10000 - 60000 * FEE_RATE, 6);
    expect(sold.positions).toHaveLength(0); // fully closed
  });

  it("supports partial sells and keeps avg entry", () => {
    const bought = applyFill(fresh, { symbol: "ETHUSDT", side: "buy", quantity: "10", price: "3000" });
    const sold = applyFill({ cash: bought.cash, positions: bought.positions }, {
      symbol: "ETHUSDT", side: "sell", quantity: "4", price: "3500",
    });
    expect(sold.ok).toBe(true);
    expect(Number(sold.positions[0].quantity)).toBe(6);
    expect(Number(sold.positions[0].avgEntryPrice)).toBe(3000);
  });

  it("rejects selling more than held (long-only, no shorting)", () => {
    const bought = applyFill(fresh, { symbol: "BTCUSDT", side: "buy", quantity: "1", price: "50000" });
    const sold = applyFill({ cash: bought.cash, positions: bought.positions }, {
      symbol: "BTCUSDT", side: "sell", quantity: "2", price: "60000",
    });
    expect(sold.ok).toBe(false);
    expect(sold.error).toBe("insufficient_position");
  });
});

describe("applyFill — validation", () => {
  it("rejects non-positive quantity", () => {
    const r = applyFill(fresh, { symbol: "BTCUSDT", side: "buy", quantity: "0", price: "50000" });
    expect(r.ok).toBe(false);
    expect(r.error).toBe("invalid_quantity");
  });

  it("rejects non-positive price", () => {
    const r = applyFill(fresh, { symbol: "BTCUSDT", side: "buy", quantity: "1", price: "0" });
    expect(r.ok).toBe(false);
    expect(r.error).toBe("invalid_price");
  });

  it("conserves value: equity before ≈ equity after a round trip minus fees", () => {
    const buy = applyFill(fresh, { symbol: "BTCUSDT", side: "buy", quantity: "1", price: "50000" });
    const sell = applyFill({ cash: buy.cash, positions: buy.positions }, {
      symbol: "BTCUSDT", side: "sell", quantity: "1", price: "50000",
    });
    // Round trip at same price: lose exactly two fees.
    const expected = 100000 - 50000 * FEE_RATE - 50000 * FEE_RATE;
    expect(Number(sell.cash)).toBeCloseTo(expected, 6);
  });
});
