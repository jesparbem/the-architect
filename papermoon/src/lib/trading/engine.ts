// PaperMoon trading engine — PURE functions, no side effects.
// All money/quantity math uses decimal.js. Never use JS floats for values.
//
// Long-only spot simulation with average-cost accounting.

import Decimal from "decimal.js";
import type { Position } from "@/lib/types";
import { FEE_RATE } from "./fees";

Decimal.set({ precision: 40 });

export interface EngineState {
  cash: string; // decimal string
  positions: Position[];
}

export interface FillRequest {
  symbol: string;
  side: "buy" | "sell";
  quantity: string; // decimal string, > 0
  price: string; // execution price, > 0 (already includes any slippage)
}

export type FillError = "invalid_quantity" | "invalid_price" | "insufficient_funds" | "insufficient_position";

export interface FillResult {
  ok: boolean;
  error?: FillError;
  cash: string;
  positions: Position[];
  fee: string;
  realizedPnl: string | null;
  fillPrice: string;
}

function findPosition(positions: Position[], symbol: string): Position | undefined {
  return positions.find((p) => p.symbol === symbol);
}

/**
 * Apply a fill to engine state and return the NEW state (immutable).
 * On error, returns the unchanged state with `ok: false` and an error code.
 */
export function applyFill(state: EngineState, req: FillRequest): FillResult {
  const qty = new Decimal(req.quantity || "0");
  const price = new Decimal(req.price || "0");
  const cash = new Decimal(state.cash);

  const base: FillResult = {
    ok: false,
    cash: state.cash,
    positions: state.positions,
    fee: "0",
    realizedPnl: null,
    fillPrice: req.price,
  };

  if (!qty.isFinite() || qty.lte(0)) return { ...base, error: "invalid_quantity" };
  if (!price.isFinite() || price.lte(0)) return { ...base, error: "invalid_price" };

  const notional = qty.mul(price);
  const fee = notional.mul(FEE_RATE);
  const existing = findPosition(state.positions, req.symbol);

  if (req.side === "buy") {
    const totalCost = notional.plus(fee);
    if (totalCost.gt(cash)) return { ...base, error: "insufficient_funds" };

    const newCash = cash.minus(totalCost);
    let positions: Position[];
    if (existing) {
      const oldQty = new Decimal(existing.quantity);
      const oldAvg = new Decimal(existing.avgEntryPrice);
      const newQty = oldQty.plus(qty);
      // Weighted average cost (fees excluded from basis, tracked separately).
      const newAvg = oldQty.mul(oldAvg).plus(qty.mul(price)).div(newQty);
      positions = state.positions.map((p) =>
        p.symbol === req.symbol
          ? { ...p, quantity: newQty.toString(), avgEntryPrice: newAvg.toString() }
          : p,
      );
    } else {
      positions = [
        ...state.positions,
        { symbol: req.symbol, quantity: qty.toString(), avgEntryPrice: price.toString() },
      ];
    }
    return {
      ok: true,
      cash: newCash.toString(),
      positions,
      fee: fee.toString(),
      realizedPnl: null,
      fillPrice: req.price,
    };
  }

  // side === "sell" — long-only, cannot sell more than held.
  if (!existing) return { ...base, error: "insufficient_position" };
  const heldQty = new Decimal(existing.quantity);
  if (qty.gt(heldQty)) return { ...base, error: "insufficient_position" };

  const avg = new Decimal(existing.avgEntryPrice);
  const proceeds = notional.minus(fee);
  const newCash = cash.plus(proceeds);
  // Realized PnL on the sold quantity, net of the exit fee.
  const realizedPnl = price.minus(avg).mul(qty).minus(fee);
  const remaining = heldQty.minus(qty);

  let positions: Position[];
  if (remaining.lte(0)) {
    positions = state.positions.filter((p) => p.symbol !== req.symbol);
  } else {
    positions = state.positions.map((p) =>
      p.symbol === req.symbol ? { ...p, quantity: remaining.toString() } : p,
    );
  }

  return {
    ok: true,
    cash: newCash.toString(),
    positions,
    fee: fee.toString(),
    realizedPnl: realizedPnl.toString(),
    fillPrice: req.price,
  };
}

/** Estimate the cash cost of a prospective buy (notional + fee). */
export function estimateBuyCost(quantity: string, price: string): string {
  const notional = new Decimal(quantity || "0").mul(price || "0");
  return notional.plus(notional.mul(FEE_RATE)).toString();
}

/** Estimate the cash proceeds of a prospective sell (notional − fee). */
export function estimateSellProceeds(quantity: string, price: string): string {
  const notional = new Decimal(quantity || "0").mul(price || "0");
  return notional.minus(notional.mul(FEE_RATE)).toString();
}

/** Current market value of a position at a given price. */
export function positionValue(position: Position, price: number): number {
  return new Decimal(position.quantity).mul(price || 0).toNumber();
}

/** Unrealized PnL of a position at a given price. */
export function unrealizedPnl(position: Position, price: number): number {
  return new Decimal(price || 0).minus(position.avgEntryPrice).mul(position.quantity).toNumber();
}

/** Unrealized PnL as a percentage of cost basis. */
export function unrealizedPnlPct(position: Position, price: number): number {
  const basis = new Decimal(position.avgEntryPrice).mul(position.quantity);
  if (basis.lte(0)) return 0;
  return new Decimal(price || 0).minus(position.avgEntryPrice).mul(position.quantity).div(basis).mul(100).toNumber();
}

/** Total equity = cash + Σ position market values. */
export function totalEquity(cash: string, positions: Position[], priceOf: (symbol: string) => number): number {
  let equity = new Decimal(cash);
  for (const p of positions) {
    equity = equity.plus(new Decimal(p.quantity).mul(priceOf(p.symbol) || 0));
  }
  return equity.toNumber();
}
