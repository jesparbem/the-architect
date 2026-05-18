import time
import json
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Optional
from datetime import datetime

STARTING_CAPITAL = 50.0
TRADE_FEE = 0.001  # 0.1% per trade (Binance standard)
SLIPPAGE = 0.0005  # 0.05% slippage simulation

@dataclass
class Position:
    coin_id: str
    symbol: str
    name: str
    quantity: float
    entry_price: float
    entry_time: float
    stop_loss: float
    take_profit: float
    fees_paid: float = 0.0

    def current_value(self, current_price: float) -> float:
        return self.quantity * current_price

    def pnl(self, current_price: float) -> float:
        return (current_price - self.entry_price) * self.quantity

    def pnl_pct(self, current_price: float) -> float:
        return ((current_price - self.entry_price) / self.entry_price) * 100

    def to_dict(self, current_price: float = None) -> dict:
        d = asdict(self)
        if current_price:
            d['current_price'] = current_price
            d['current_value'] = self.current_value(current_price)
            d['pnl'] = self.pnl(current_price)
            d['pnl_pct'] = self.pnl_pct(current_price)
        return d

@dataclass
class Trade:
    id: str
    coin_id: str
    symbol: str
    name: str
    action: str  # BUY or SELL
    quantity: float
    price: float
    total_value: float
    fee: float
    timestamp: float
    reason: str
    strategy: str
    pnl: float = 0.0

    def to_dict(self) -> dict:
        return asdict(self)

class Portfolio:
    def __init__(self):
        self.cash = STARTING_CAPITAL
        self.positions: Dict[str, Position] = {}
        self.trades: List[Trade] = []
        self.portfolio_history: List[dict] = []
        self.total_fees_paid = 0.0
        self.start_time = time.time()
        self.trade_counter = 0

        # Record initial state
        self._snapshot()

    def _snapshot(self, prices: dict = None):
        total_value = self.total_value(prices or {})
        self.portfolio_history.append({
            'timestamp': time.time(),
            'cash': self.cash,
            'total_value': total_value,
            'positions_count': len(self.positions)
        })
        # Keep last 1000 snapshots
        if len(self.portfolio_history) > 1000:
            self.portfolio_history = self.portfolio_history[-1000:]

    def total_value(self, prices: dict) -> float:
        positions_value = sum(
            pos.current_value(prices.get(pos.coin_id, pos.entry_price))
            for pos in self.positions.values()
        )
        return self.cash + positions_value

    def total_pnl(self, prices: dict) -> float:
        return self.total_value(prices) - STARTING_CAPITAL

    def total_pnl_pct(self, prices: dict) -> float:
        return ((self.total_value(prices) - STARTING_CAPITAL) / STARTING_CAPITAL) * 100

    def buy(self, coin_id: str, symbol: str, name: str, price: float,
            amount_usd: float, reason: str, strategy: str,
            stop_loss_pct: float = 0.07, take_profit_pct: float = 0.20) -> Optional[Trade]:
        """Buy a position. amount_usd is how much USD to spend."""

        # Can't buy if already have position
        if coin_id in self.positions:
            return None

        # Apply slippage
        effective_price = price * (1 + SLIPPAGE)

        # Calculate fee
        fee = amount_usd * TRADE_FEE
        actual_spend = amount_usd - fee

        if actual_spend <= 0 or self.cash < amount_usd:
            return None

        quantity = actual_spend / effective_price

        self.cash -= amount_usd
        self.total_fees_paid += fee

        position = Position(
            coin_id=coin_id,
            symbol=symbol,
            name=name,
            quantity=quantity,
            entry_price=effective_price,
            entry_time=time.time(),
            stop_loss=effective_price * (1 - stop_loss_pct),
            take_profit=effective_price * (1 + take_profit_pct),
            fees_paid=fee
        )
        self.positions[coin_id] = position

        self.trade_counter += 1
        trade = Trade(
            id=f"T{self.trade_counter:04d}",
            coin_id=coin_id,
            symbol=symbol,
            name=name,
            action='BUY',
            quantity=quantity,
            price=effective_price,
            total_value=amount_usd,
            fee=fee,
            timestamp=time.time(),
            reason=reason,
            strategy=strategy
        )
        self.trades.append(trade)

        return trade

    def sell(self, coin_id: str, current_price: float, reason: str, strategy: str) -> Optional[Trade]:
        """Sell an entire position."""
        if coin_id not in self.positions:
            return None

        position = self.positions[coin_id]

        # Apply slippage (negative on sell)
        effective_price = current_price * (1 - SLIPPAGE)

        gross_value = position.quantity * effective_price
        fee = gross_value * TRADE_FEE
        net_value = gross_value - fee

        pnl = net_value - (position.quantity * position.entry_price) - position.fees_paid

        self.cash += net_value
        self.total_fees_paid += fee
        del self.positions[coin_id]

        self.trade_counter += 1
        trade = Trade(
            id=f"T{self.trade_counter:04d}",
            coin_id=coin_id,
            symbol=position.symbol,
            name=position.name,
            action='SELL',
            quantity=position.quantity,
            price=effective_price,
            total_value=net_value,
            fee=fee,
            timestamp=time.time(),
            reason=reason,
            strategy=strategy,
            pnl=pnl
        )
        self.trades.append(trade)

        return trade

    def check_stop_loss_take_profit(self, prices: dict) -> List[tuple]:
        """Check all positions for SL/TP triggers. Returns list of (coin_id, reason)."""
        triggers = []
        for coin_id, pos in self.positions.items():
            price = prices.get(coin_id)
            if not price:
                continue
            if price <= pos.stop_loss:
                triggers.append((coin_id, f"Stop loss hit at ${price:.4f} (entry: ${pos.entry_price:.4f})", "STOP_LOSS"))
            elif price >= pos.take_profit:
                triggers.append((coin_id, f"Take profit hit at ${price:.4f} (+{pos.pnl_pct(price):.1f}%)", "TAKE_PROFIT"))
        return triggers

    def to_dict(self, prices: dict = None) -> dict:
        prices = prices or {}
        positions_dict = {
            k: v.to_dict(prices.get(k))
            for k, v in self.positions.items()
        }
        return {
            'cash': self.cash,
            'total_value': self.total_value(prices),
            'total_pnl': self.total_pnl(prices),
            'total_pnl_pct': self.total_pnl_pct(prices),
            'total_fees_paid': self.total_fees_paid,
            'positions': positions_dict,
            'trades_count': len(self.trades),
            'trades': [t.to_dict() for t in self.trades[-20:]],  # last 20 trades
            'portfolio_history': self.portfolio_history,
            'start_time': self.start_time,
            'starting_capital': STARTING_CAPITAL
        }
