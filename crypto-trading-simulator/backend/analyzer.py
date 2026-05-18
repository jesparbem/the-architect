import math
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass

@dataclass
class Signal:
    coin_id: str
    symbol: str
    name: str
    signal: str  # STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL
    strength: float  # 0-100
    reasons: List[str]
    strategy: str
    current_price: float
    rsi: Optional[float] = None
    macd_signal: Optional[str] = None
    volume_spike: bool = False
    momentum_1h: float = 0.0
    momentum_24h: float = 0.0
    momentum_7d: float = 0.0
    potential_gain_pct: float = 0.0

class TechnicalAnalyzer:

    @staticmethod
    def calculate_ema(prices: List[float], period: int) -> List[float]:
        if len(prices) < period:
            return []
        k = 2 / (period + 1)
        emas = [sum(prices[:period]) / period]
        for price in prices[period:]:
            emas.append(price * k + emas[-1] * (1 - k))
        return emas

    @staticmethod
    def calculate_rsi(prices: List[float], period: int = 14) -> Optional[float]:
        if len(prices) < period + 1:
            return None

        deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
        gains = [max(d, 0) for d in deltas]
        losses = [max(-d, 0) for d in deltas]

        avg_gain = sum(gains[:period]) / period
        avg_loss = sum(losses[:period]) / period

        for i in range(period, len(gains)):
            avg_gain = (avg_gain * (period - 1) + gains[i]) / period
            avg_loss = (avg_loss * (period - 1) + losses[i]) / period

        if avg_loss == 0:
            return 100.0

        rs = avg_gain / avg_loss
        return 100 - (100 / (1 + rs))

    @staticmethod
    def calculate_macd(prices: List[float]) -> Tuple[Optional[float], Optional[float], Optional[str]]:
        """Returns (macd_line, signal_line, signal: BULLISH/BEARISH/NEUTRAL)"""
        if len(prices) < 26:
            return None, None, None

        ema12 = TechnicalAnalyzer.calculate_ema(prices, 12)
        ema26 = TechnicalAnalyzer.calculate_ema(prices, 26)

        if not ema12 or not ema26:
            return None, None, None

        # Align them
        offset = len(ema12) - len(ema26)
        if offset > 0:
            ema12 = ema12[offset:]

        macd_line = [e12 - e26 for e12, e26 in zip(ema12, ema26)]

        if len(macd_line) < 9:
            return None, None, None

        k = 2 / (9 + 1)
        signal_line_vals = [sum(macd_line[:9]) / 9]
        for m in macd_line[9:]:
            signal_line_vals.append(m * k + signal_line_vals[-1] * (1 - k))

        if not macd_line or not signal_line_vals:
            return None, None, None

        current_macd = macd_line[-1]
        current_signal = signal_line_vals[-1]

        if current_macd > current_signal and current_macd > 0:
            macd_signal = "BULLISH"
        elif current_macd < current_signal and current_macd < 0:
            macd_signal = "BEARISH"
        else:
            macd_signal = "NEUTRAL"

        return current_macd, current_signal, macd_signal

    @staticmethod
    def calculate_bollinger_bands(prices: List[float], period: int = 20) -> Tuple[Optional[float], Optional[float], Optional[float]]:
        """Returns (upper, middle, lower)"""
        if len(prices) < period:
            return None, None, None

        recent = prices[-period:]
        middle = sum(recent) / period
        variance = sum((p - middle) ** 2 for p in recent) / period
        std = math.sqrt(variance)

        return middle + 2 * std, middle, middle - 2 * std

    @staticmethod
    def detect_volume_spike(volume: float, avg_volume: float) -> bool:
        if avg_volume <= 0:
            return False
        return volume > avg_volume * 2.5  # 2.5x average volume = spike

    def analyze_coin(self, coin_data: dict, price_history: List[float]) -> Signal:
        """Full technical analysis of a coin."""
        coin_id = coin_data.get('id', '')
        symbol = coin_data.get('symbol', '').upper()
        name = coin_data.get('name', '')
        current_price = coin_data.get('current_price', 0)

        reasons = []
        signal_strength = 50.0  # Start neutral

        # Price momentum
        momentum_1h = coin_data.get('price_change_percentage_1h_in_currency', 0) or 0
        momentum_24h = coin_data.get('price_change_percentage_24h', 0) or 0
        momentum_7d = coin_data.get('price_change_percentage_7d_in_currency', 0) or 0

        # Volume spike detection
        volume = coin_data.get('total_volume', 0) or 0
        market_cap = coin_data.get('market_cap', 1) or 1
        volume_to_mcap = volume / market_cap if market_cap > 0 else 0
        volume_spike = volume_to_mcap > 0.25  # High volume relative to market cap

        # RSI
        rsi = self.calculate_rsi(price_history) if len(price_history) >= 15 else None

        # MACD
        macd_val, macd_signal_val, macd_signal = self.calculate_macd(price_history) if len(price_history) >= 35 else (None, None, None)

        # Bollinger Bands
        upper_bb, middle_bb, lower_bb = self.calculate_bollinger_bands(price_history) if len(price_history) >= 20 else (None, None, None)

        # Signal logic
        buy_signals = 0
        sell_signals = 0

        # RSI signals
        if rsi is not None:
            if rsi < 30:
                buy_signals += 2
                signal_strength += 20
                reasons.append(f"RSI oversold ({rsi:.1f})")
            elif rsi < 45:
                buy_signals += 1
                signal_strength += 10
                reasons.append(f"RSI bullish ({rsi:.1f})")
            elif rsi > 75:
                sell_signals += 2
                signal_strength -= 20
                reasons.append(f"RSI overbought ({rsi:.1f})")
            elif rsi > 60:
                sell_signals += 1
                signal_strength -= 10
                reasons.append(f"RSI bearish ({rsi:.1f})")

        # MACD signals
        if macd_signal == "BULLISH":
            buy_signals += 1
            signal_strength += 15
            reasons.append("MACD bullish crossover")
        elif macd_signal == "BEARISH":
            sell_signals += 1
            signal_strength -= 15
            reasons.append("MACD bearish crossover")

        # Momentum signals
        if momentum_1h > 2:
            buy_signals += 1
            signal_strength += 10
            reasons.append(f"Strong 1h momentum +{momentum_1h:.1f}%")
        elif momentum_1h < -2:
            sell_signals += 1
            signal_strength -= 10
            reasons.append(f"Negative 1h momentum {momentum_1h:.1f}%")

        if momentum_24h > 5:
            buy_signals += 1
            signal_strength += 8
            reasons.append(f"24h momentum +{momentum_24h:.1f}%")
        elif momentum_24h < -8:
            sell_signals += 1
            signal_strength -= 8
            reasons.append(f"24h decline {momentum_24h:.1f}%")

        # Volume spike
        if volume_spike:
            if momentum_24h > 0:
                buy_signals += 1
                signal_strength += 12
                reasons.append(f"High volume spike (V/MC: {volume_to_mcap:.2f})")
            else:
                sell_signals += 1
                signal_strength -= 5
                reasons.append(f"Volume spike with declining price")

        # Bollinger Bands
        if lower_bb and current_price < lower_bb:
            buy_signals += 1
            signal_strength += 10
            reasons.append("Price below lower Bollinger Band (oversold)")
        elif upper_bb and current_price > upper_bb:
            sell_signals += 1
            signal_strength -= 10
            reasons.append("Price above upper Bollinger Band (overbought)")

        # 7-day trend for new coin detection (300% potential)
        potential_gain_pct = 0
        if momentum_7d > 50 and momentum_24h > 10:
            potential_gain_pct = momentum_7d * 3  # Extrapolate optimistically
            reasons.append(f"High growth potential: +{potential_gain_pct:.0f}% projected")

        # Determine final signal
        signal_strength = max(0, min(100, signal_strength))

        if signal_strength >= 75 and buy_signals >= 3:
            final_signal = "STRONG_BUY"
        elif signal_strength >= 60 and buy_signals > sell_signals:
            final_signal = "BUY"
        elif signal_strength <= 25 and sell_signals >= 3:
            final_signal = "STRONG_SELL"
        elif signal_strength <= 40 and sell_signals > buy_signals:
            final_signal = "SELL"
        else:
            final_signal = "HOLD"

        # Determine primary strategy
        if rsi and rsi < 35:
            strategy = "RSI_OVERSOLD"
        elif macd_signal == "BULLISH":
            strategy = "MACD_CROSSOVER"
        elif volume_spike and momentum_24h > 10:
            strategy = "VOLUME_BREAKOUT"
        elif momentum_7d > 30:
            strategy = "MOMENTUM"
        else:
            strategy = "COMPOSITE"

        return Signal(
            coin_id=coin_id,
            symbol=symbol,
            name=name,
            signal=final_signal,
            strength=signal_strength,
            reasons=reasons[:5],  # Top 5 reasons
            strategy=strategy,
            current_price=current_price,
            rsi=rsi,
            macd_signal=macd_signal,
            volume_spike=volume_spike,
            momentum_1h=momentum_1h,
            momentum_24h=momentum_24h,
            momentum_7d=momentum_7d,
            potential_gain_pct=potential_gain_pct
        )

    def find_opportunities(self, all_market_data: List[dict], price_histories: Dict[str, List[float]]) -> List[Signal]:
        """Analyze all coins and return ranked opportunities."""
        signals = []

        for coin in all_market_data:
            coin_id = coin.get('id', '')
            history = price_histories.get(coin_id, [])

            # Need at least some data
            if not coin.get('current_price'):
                continue

            signal = self.analyze_coin(coin, history)
            signals.append(signal)

        # Sort: STRONG_BUY first, then by strength
        signal_order = {'STRONG_BUY': 0, 'BUY': 1, 'HOLD': 2, 'SELL': 3, 'STRONG_SELL': 4}
        signals.sort(key=lambda s: (signal_order.get(s.signal, 2), -s.strength))

        return signals
