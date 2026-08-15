// Trading cost configuration for the simulator.

/** Taker fee rate applied to the notional of every fill (0.1%, Binance-like). */
export const FEE_RATE = 0.001;

/**
 * Optional slippage applied to market orders to model imperfect fills.
 * 0 by default (kept simple + deterministic). Buys fill slightly higher,
 * sells slightly lower when > 0.
 */
export const SLIPPAGE_RATE = 0;

/** Starting virtual cash for every new portfolio (USDT). */
export const STARTING_BALANCE = 100_000;
