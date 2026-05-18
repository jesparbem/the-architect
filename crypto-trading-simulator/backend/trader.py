import asyncio
import time
import logging
from typing import List, Dict, Optional
from dataclasses import asdict
from analyzer import TechnicalAnalyzer, Signal
from fetcher import PriceFetcher
from portfolio import Portfolio

logger = logging.getLogger(__name__)

# Risk management parameters
MAX_POSITION_SIZE_PCT = 0.30    # Max 30% of portfolio per position
MIN_TRADE_USD = 2.0              # Minimum trade size
MAX_POSITIONS = 5                # Max concurrent positions
MIN_SIGNAL_STRENGTH = 62         # Minimum signal strength to buy

class TradingAgent:
    def __init__(self, portfolio: Portfolio, fetcher: PriceFetcher, analyzer: TechnicalAnalyzer):
        self.portfolio = portfolio
        self.fetcher = fetcher
        self.analyzer = analyzer
        self.agent_log: List[dict] = []
        self.is_running = False
        self.cycle_count = 0
        self.day_count = 1
        self.current_signals: List[Signal] = []
        self.market_data: List[dict] = []
        self.last_trade_time: Dict[str, float] = {}  # Cooldown per coin

    def _log(self, message: str, level: str = "INFO", action: str = None):
        entry = {
            'timestamp': time.time(),
            'message': message,
            'level': level,
            'action': action,
            'cycle': self.cycle_count,
            'day': self.day_count
        }
        self.agent_log.append(entry)
        logger.info(f"[Agent] {message}")
        # Keep last 200 log entries
        if len(self.agent_log) > 200:
            self.agent_log = self.agent_log[-200:]

    def _cooldown_ok(self, coin_id: str, cooldown_seconds: int = 300) -> bool:
        """Check if enough time has passed since last trade of this coin."""
        last = self.last_trade_time.get(coin_id, 0)
        return (time.time() - last) > cooldown_seconds

    def _calculate_position_size(self, portfolio_value: float, signal_strength: float) -> float:
        """Calculate how much USD to invest based on signal strength and portfolio value."""
        # Kelly-inspired sizing: stronger signal = larger position
        base_pct = 0.15  # 15% base
        strength_bonus = ((signal_strength - MIN_SIGNAL_STRENGTH) / (100 - MIN_SIGNAL_STRENGTH)) * 0.15
        position_pct = min(base_pct + strength_bonus, MAX_POSITION_SIZE_PCT)

        amount = portfolio_value * position_pct
        return max(amount, MIN_TRADE_USD)

    async def _update_market_data(self):
        """Fetch fresh market data."""
        self._log("Fetching market data from CoinGecko...", action="FETCH")

        # Fetch top coins
        coins = await self.fetcher.fetch_top_coins(80)

        # Also fetch trending
        trending = await self.fetcher.fetch_trending()

        self.market_data = coins
        self._log(f"Updated data for {len(coins)} coins. {len(trending)} trending.", action="FETCH")

        return coins

    async def _analyze_market(self):
        """Run technical analysis on all coins."""
        self._log("Running technical analysis...", action="ANALYZE")

        price_histories = self.fetcher.price_history
        signals = self.analyzer.find_opportunities(self.market_data, price_histories)
        self.current_signals = signals

        buy_signals = [s for s in signals if s.signal in ('BUY', 'STRONG_BUY')]
        sell_signals = [s for s in signals if s.signal in ('SELL', 'STRONG_SELL')]

        self._log(
            f"Analysis: {len(buy_signals)} BUY signals, {len(sell_signals)} SELL signals",
            action="ANALYZE"
        )

        if buy_signals:
            top = buy_signals[0]
            self._log(
                f"Top opportunity: {top.symbol} ({top.signal}) strength={top.strength:.0f}% | {', '.join(top.reasons[:2])}",
                action="SIGNAL"
            )

        return signals

    async def _execute_sells(self, prices: Dict[str, float]):
        """Check positions and sell if stop loss, take profit, or signal reversal."""
        # Check SL/TP
        triggers = self.portfolio.check_stop_loss_take_profit(prices)
        for coin_id, reason, trigger_type in triggers:
            price = prices.get(coin_id, 0)
            trade = self.portfolio.sell(coin_id, price, reason, trigger_type)
            if trade:
                emoji = "STOP_LOSS" if trigger_type == "STOP_LOSS" else "TAKE_PROFIT"
                self._log(
                    f"{trigger_type}: Sold {trade.symbol} @ ${price:.4f} | PnL: ${trade.pnl:+.2f}",
                    level="TRADE",
                    action="SELL"
                )
                self.last_trade_time[coin_id] = time.time()

        # Check signal reversals for existing positions
        signal_map = {s.coin_id: s for s in self.current_signals}
        for coin_id in list(self.portfolio.positions.keys()):
            if coin_id in [t[0] for t in triggers]:
                continue  # Already handled above

            signal = signal_map.get(coin_id)
            if signal and signal.signal in ('SELL', 'STRONG_SELL'):
                price = prices.get(coin_id, 0)
                if price and self._cooldown_ok(coin_id, 600):
                    trade = self.portfolio.sell(
                        coin_id, price,
                        f"Signal reversal: {signal.signal} (strength: {signal.strength:.0f}%)",
                        signal.strategy
                    )
                    if trade:
                        self._log(
                            f"SELL signal: Sold {trade.symbol} @ ${price:.4f} | PnL: ${trade.pnl:+.2f} | {', '.join(signal.reasons[:2])}",
                            level="TRADE",
                            action="SELL"
                        )
                        self.last_trade_time[coin_id] = time.time()

    async def _execute_buys(self, prices: Dict[str, float]):
        """Buy top opportunities."""
        if len(self.portfolio.positions) >= MAX_POSITIONS:
            self._log(f"Max positions ({MAX_POSITIONS}) reached, skipping buys", action="SKIP")
            return

        buy_candidates = [
            s for s in self.current_signals
            if s.signal in ('BUY', 'STRONG_BUY')
            and s.strength >= MIN_SIGNAL_STRENGTH
            and s.coin_id not in self.portfolio.positions
            and self._cooldown_ok(s.coin_id)
        ]

        for signal in buy_candidates[:3]:  # Max 3 new positions per cycle
            if len(self.portfolio.positions) >= MAX_POSITIONS:
                break

            portfolio_value = self.portfolio.total_value(prices)
            if portfolio_value < MIN_TRADE_USD * 2:
                self._log(f"Insufficient capital (${portfolio_value:.2f}), pausing buys", action="SKIP")
                break

            available_cash = self.portfolio.cash
            if available_cash < MIN_TRADE_USD:
                self._log(f"Low cash (${available_cash:.2f})", action="SKIP")
                break

            amount = min(
                self._calculate_position_size(portfolio_value, signal.strength),
                available_cash * 0.95  # Never spend more than 95% of remaining cash
            )

            if amount < MIN_TRADE_USD:
                continue

            current_price = prices.get(signal.coin_id, signal.current_price)

            # Set tighter stop loss for STRONG_BUY, wider for normal BUY
            sl_pct = 0.05 if signal.signal == 'STRONG_BUY' else 0.07
            tp_pct = 0.25 if signal.signal == 'STRONG_BUY' else 0.15

            trade = self.portfolio.buy(
                coin_id=signal.coin_id,
                symbol=signal.symbol,
                name=signal.name,
                price=current_price,
                amount_usd=amount,
                reason=f"{signal.signal}: {', '.join(signal.reasons[:2])}",
                strategy=signal.strategy,
                stop_loss_pct=sl_pct,
                take_profit_pct=tp_pct
            )

            if trade:
                self._log(
                    f"BUY {trade.symbol} @ ${current_price:.4f} | ${amount:.2f} | Strategy: {signal.strategy} | {', '.join(signal.reasons[:2])}",
                    level="TRADE",
                    action="BUY"
                )
                self.last_trade_time[signal.coin_id] = time.time()

    async def run_cycle(self):
        """Run one complete trading cycle."""
        self.cycle_count += 1
        self.day_count = max(1, (self.cycle_count // 48) + 1)  # ~48 cycles per day at 30min intervals

        self._log(f"Trading cycle #{self.cycle_count} (Day {self.day_count})", action="CYCLE")

        try:
            # 1. Update market data
            await self._update_market_data()

            # 2. Analyze market
            await self._analyze_market()

            # 3. Get current prices
            prices = self.fetcher.get_all_prices()

            # 4. Execute sells first (risk management)
            await self._execute_sells(prices)

            # 5. Execute buys (opportunity capture)
            await self._execute_buys(prices)

            # 6. Log portfolio status
            portfolio_value = self.portfolio.total_value(prices)
            pnl = self.portfolio.total_pnl(prices)
            pnl_pct = self.portfolio.total_pnl_pct(prices)

            self._log(
                f"Portfolio: ${portfolio_value:.2f} (PnL: ${pnl:+.2f} / {pnl_pct:+.1f}%) | Cash: ${self.portfolio.cash:.2f} | Positions: {len(self.portfolio.positions)}",
                action="STATUS"
            )

            # Take portfolio snapshot
            self.portfolio._snapshot(prices)

        except Exception as e:
            self._log(f"Error in trading cycle: {e}", level="ERROR")
            logger.exception("Trading cycle error")

    def get_state(self) -> dict:
        prices = self.fetcher.get_all_prices()
        return {
            'is_running': self.is_running,
            'cycle_count': self.cycle_count,
            'day_count': self.day_count,
            'portfolio': self.portfolio.to_dict(prices),
            'agent_log': self.agent_log[-50:],
            'signals': [
                {
                    'coin_id': s.coin_id,
                    'symbol': s.symbol,
                    'name': s.name,
                    'signal': s.signal,
                    'strength': s.strength,
                    'reasons': s.reasons,
                    'strategy': s.strategy,
                    'current_price': s.current_price,
                    'rsi': s.rsi,
                    'macd_signal': s.macd_signal,
                    'volume_spike': s.volume_spike,
                    'momentum_1h': s.momentum_1h,
                    'momentum_24h': s.momentum_24h,
                    'momentum_7d': s.momentum_7d,
                    'potential_gain_pct': s.potential_gain_pct
                }
                for s in self.current_signals[:30]
            ],
            'market_data': self.market_data[:30],
            'last_update': time.time()
        }
