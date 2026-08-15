"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order, OrderSide, Position, Trade, EquityPoint } from "@/lib/types";
import { applyFill, type FillError } from "@/lib/trading/engine";
import { SLIPPAGE_RATE, STARTING_BALANCE } from "@/lib/trading/fees";
import { uid } from "@/lib/utils";
import Decimal from "decimal.js";

export interface PlaceOrderInput {
  symbol: string;
  side: OrderSide;
  quantity: string;
  /** Reference market price at submit time (execution price for market orders). */
  price: string;
}

export interface PlaceOrderResult {
  ok: boolean;
  error?: FillError;
  order?: Order;
}

interface PortfolioState {
  cash: string;
  startingBalance: number;
  positions: Position[];
  orders: Order[];
  trades: Trade[];
  equityHistory: EquityPoint[];
  createdAt: number;

  placeMarketOrder: (input: PlaceOrderInput) => PlaceOrderResult;
  recordEquity: (equity: number) => void;
  reset: () => void;
}

/** Apply configured slippage to a market execution price. */
function withSlippage(price: string, side: OrderSide): string {
  if (SLIPPAGE_RATE === 0) return price;
  const p = new Decimal(price);
  const adj = side === "buy" ? p.mul(1 + SLIPPAGE_RATE) : p.mul(1 - SLIPPAGE_RATE);
  return adj.toString();
}

const EQUITY_HISTORY_CAP = 2000;

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      cash: String(STARTING_BALANCE),
      startingBalance: STARTING_BALANCE,
      positions: [],
      orders: [],
      trades: [],
      equityHistory: [],
      createdAt: Date.now(),

      placeMarketOrder: (input) => {
        const state = get();
        const execPrice = withSlippage(input.price, input.side);
        const result = applyFill(
          { cash: state.cash, positions: state.positions },
          { symbol: input.symbol, side: input.side, quantity: input.quantity, price: execPrice },
        );

        const now = Date.now();
        if (!result.ok) {
          const rejected: Order = {
            id: uid("ord_"),
            symbol: input.symbol,
            side: input.side,
            type: "market",
            status: "rejected",
            quantity: input.quantity,
            limitPrice: null,
            fillPrice: null,
            fee: "0",
            rejectReason: result.error ?? "unknown",
            createdAt: now,
            filledAt: null,
          };
          set({ orders: [rejected, ...state.orders] });
          return { ok: false, error: result.error, order: rejected };
        }

        const order: Order = {
          id: uid("ord_"),
          symbol: input.symbol,
          side: input.side,
          type: "market",
          status: "filled",
          quantity: input.quantity,
          limitPrice: null,
          fillPrice: result.fillPrice,
          fee: result.fee,
          rejectReason: null,
          createdAt: now,
          filledAt: now,
        };
        const trade: Trade = {
          id: uid("trd_"),
          orderId: order.id,
          symbol: input.symbol,
          side: input.side,
          quantity: input.quantity,
          price: result.fillPrice,
          fee: result.fee,
          realizedPnl: result.realizedPnl,
          createdAt: now,
        };

        set({
          cash: result.cash,
          positions: result.positions,
          orders: [order, ...state.orders],
          trades: [trade, ...state.trades],
        });
        return { ok: true, order };
      },

      recordEquity: (equity) =>
        set((state) => {
          const last = state.equityHistory[state.equityHistory.length - 1];
          // Throttle: at most one point per 30s.
          if (last && Date.now() - last.ts < 30_000) return state;
          const next = [...state.equityHistory, { ts: Date.now(), equity }];
          if (next.length > EQUITY_HISTORY_CAP) next.shift();
          return { equityHistory: next };
        }),

      reset: () =>
        set({
          cash: String(STARTING_BALANCE),
          startingBalance: STARTING_BALANCE,
          positions: [],
          orders: [],
          trades: [],
          equityHistory: [],
          createdAt: Date.now(),
        }),
    }),
    {
      name: "papermoon-portfolio-v1",
      partialize: (s) => ({
        cash: s.cash,
        startingBalance: s.startingBalance,
        positions: s.positions,
        orders: s.orders,
        trades: s.trades,
        equityHistory: s.equityHistory,
        createdAt: s.createdAt,
      }),
    },
  ),
);
