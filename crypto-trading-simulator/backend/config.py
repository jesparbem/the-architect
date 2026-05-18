from dataclasses import dataclass, asdict


@dataclass
class TradingConfig:
    min_signal_strength: float = 62.0
    max_position_size_pct: float = 0.30
    max_positions: int = 5
    default_stop_loss_pct: float = 0.07
    default_take_profit_pct: float = 0.20
    cycle_interval: int = 90
    is_paused: bool = False
    mode: str = "balanced"  # conservative, balanced, aggressive

    def to_dict(self):
        return asdict(self)

    def apply_mode(self, mode: str):
        self.mode = mode
        if mode == "conservative":
            self.min_signal_strength = 72.0
            self.max_position_size_pct = 0.20
            self.max_positions = 3
            self.default_stop_loss_pct = 0.05
            self.default_take_profit_pct = 0.15
        elif mode == "aggressive":
            self.min_signal_strength = 52.0
            self.max_position_size_pct = 0.40
            self.max_positions = 7
            self.default_stop_loss_pct = 0.10
            self.default_take_profit_pct = 0.35
        else:  # balanced
            self.min_signal_strength = 62.0
            self.max_position_size_pct = 0.30
            self.max_positions = 5
            self.default_stop_loss_pct = 0.07
            self.default_take_profit_pct = 0.20


# Global mutable config — shared between trader and chat agent
trading_config = TradingConfig()
