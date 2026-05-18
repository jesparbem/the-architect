"""
Persistent SQLite database layer — stores all trading data across sessions.
Uses aiosqlite for async operations.
"""
import asyncio
import aiosqlite
import time
import uuid
import logging
from pathlib import Path
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).parent / "data" / "trading.db"


async def init_db() -> aiosqlite.Connection:
    """Initialize the database, create tables if needed, return connection."""
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = await aiosqlite.connect(DB_PATH)
    conn.row_factory = aiosqlite.Row
    await conn.execute("PRAGMA journal_mode=WAL")
    await conn.execute("PRAGMA foreign_keys=ON")
    await _create_tables(conn)
    await conn.commit()
    logger.info(f"Database ready at {DB_PATH}")
    return conn


async def _create_tables(conn: aiosqlite.Connection):
    await conn.executescript("""
        CREATE TABLE IF NOT EXISTS sessions (
            id          TEXT PRIMARY KEY,
            started_at  REAL NOT NULL,
            start_cap   REAL NOT NULL DEFAULT 50.0,
            ended_at    REAL,
            final_value REAL
        );

        CREATE TABLE IF NOT EXISTS trades (
            id          TEXT PRIMARY KEY,
            session_id  TEXT NOT NULL REFERENCES sessions(id),
            coin_id     TEXT NOT NULL,
            symbol      TEXT NOT NULL,
            name        TEXT NOT NULL,
            action      TEXT NOT NULL,   -- BUY | SELL
            quantity    REAL NOT NULL,
            price       REAL NOT NULL,
            total_value REAL NOT NULL,
            fee         REAL NOT NULL,
            pnl         REAL DEFAULT 0,
            strategy    TEXT,
            reason      TEXT,
            timestamp   REAL NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_trades_session  ON trades(session_id);
        CREATE INDEX IF NOT EXISTS idx_trades_ts       ON trades(timestamp);
        CREATE INDEX IF NOT EXISTS idx_trades_coin     ON trades(coin_id);

        CREATE TABLE IF NOT EXISTS portfolio_snapshots (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id       TEXT NOT NULL REFERENCES sessions(id),
            timestamp        REAL NOT NULL,
            cash             REAL NOT NULL,
            total_value      REAL NOT NULL,
            positions_count  INTEGER NOT NULL DEFAULT 0,
            pnl              REAL NOT NULL DEFAULT 0,
            pnl_pct          REAL NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS idx_snap_session ON portfolio_snapshots(session_id);
        CREATE INDEX IF NOT EXISTS idx_snap_ts      ON portfolio_snapshots(timestamp);

        CREATE TABLE IF NOT EXISTS agent_logs (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id  TEXT NOT NULL REFERENCES sessions(id),
            timestamp   REAL NOT NULL,
            level       TEXT NOT NULL DEFAULT 'INFO',
            action      TEXT,
            message     TEXT NOT NULL,
            cycle       INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_log_session ON agent_logs(session_id);

        CREATE TABLE IF NOT EXISTS price_snapshots (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL REFERENCES sessions(id),
            timestamp  REAL NOT NULL,
            coin_id    TEXT NOT NULL,
            symbol     TEXT NOT NULL,
            price      REAL NOT NULL,
            volume_24h REAL,
            change_24h REAL
        );
        CREATE INDEX IF NOT EXISTS idx_price_session ON price_snapshots(session_id);
        CREATE INDEX IF NOT EXISTS idx_price_coin    ON price_snapshots(coin_id, timestamp);

        CREATE TABLE IF NOT EXISTS signals_log (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id   TEXT NOT NULL REFERENCES sessions(id),
            timestamp    REAL NOT NULL,
            coin_id      TEXT NOT NULL,
            symbol       TEXT NOT NULL,
            signal       TEXT NOT NULL,
            strength     REAL,
            rsi          REAL,
            macd_signal  TEXT,
            momentum_24h REAL,
            strategy     TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_sig_session ON signals_log(session_id);

        CREATE TABLE IF NOT EXISTS historical_prices (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            coin_id    TEXT NOT NULL,
            symbol     TEXT NOT NULL,
            timestamp  REAL NOT NULL,
            price      REAL NOT NULL,
            volume     REAL,
            market_cap REAL
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_hist_coin_ts ON historical_prices(coin_id, timestamp);
        CREATE INDEX IF NOT EXISTS idx_hist_coin ON historical_prices(coin_id);
    """)


class Database:
    def __init__(self):
        self.conn: Optional[aiosqlite.Connection] = None
        self.session_id: Optional[str] = None

    async def connect(self):
        self.conn = await init_db()

    async def close(self):
        if self.conn:
            await self.conn.close()

    # ── Session management ───────────────────────────────────

    async def new_session(self, start_cap: float = 50.0) -> str:
        self.session_id = str(uuid.uuid4())
        await self.conn.execute(
            "INSERT INTO sessions(id, started_at, start_cap) VALUES(?,?,?)",
            (self.session_id, time.time(), start_cap)
        )
        await self.conn.commit()
        logger.info(f"New session: {self.session_id}")
        return self.session_id

    async def end_session(self, final_value: float):
        if not self.session_id:
            return
        await self.conn.execute(
            "UPDATE sessions SET ended_at=?, final_value=? WHERE id=?",
            (time.time(), final_value, self.session_id)
        )
        await self.conn.commit()

    # ── Trade persistence ────────────────────────────────────

    async def save_trade(self, trade_dict: dict):
        if not self.session_id:
            return
        await self.conn.execute("""
            INSERT OR IGNORE INTO trades
            (id, session_id, coin_id, symbol, name, action, quantity, price,
             total_value, fee, pnl, strategy, reason, timestamp)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            trade_dict['id'], self.session_id,
            trade_dict['coin_id'], trade_dict['symbol'], trade_dict['name'],
            trade_dict['action'], trade_dict['quantity'], trade_dict['price'],
            trade_dict['total_value'], trade_dict['fee'], trade_dict.get('pnl', 0),
            trade_dict.get('strategy'), trade_dict.get('reason'),
            trade_dict['timestamp']
        ))
        await self.conn.commit()

    # ── Portfolio snapshot ───────────────────────────────────

    async def save_snapshot(self, cash: float, total_value: float,
                             positions_count: int, pnl: float, pnl_pct: float):
        if not self.session_id:
            return
        await self.conn.execute("""
            INSERT INTO portfolio_snapshots
            (session_id, timestamp, cash, total_value, positions_count, pnl, pnl_pct)
            VALUES (?,?,?,?,?,?,?)
        """, (self.session_id, time.time(), cash, total_value, positions_count, pnl, pnl_pct))
        await self.conn.commit()

    # ── Agent log persistence ─────────────────────────────────

    async def save_log(self, message: str, level: str = "INFO",
                        action: str = None, cycle: int = None):
        if not self.session_id:
            return
        await self.conn.execute("""
            INSERT INTO agent_logs(session_id, timestamp, level, action, message, cycle)
            VALUES (?,?,?,?,?,?)
        """, (self.session_id, time.time(), level, action, message, cycle))
        await self.conn.commit()

    # ── Price snapshots ──────────────────────────────────────

    async def save_prices(self, coins: list):
        if not self.session_id or not coins:
            return
        ts = time.time()
        rows = [
            (self.session_id, ts,
             c.get('id'), c.get('symbol','').upper(), c.get('current_price', 0),
             c.get('total_volume'), c.get('price_change_percentage_24h'))
            for c in coins[:30] if c.get('current_price')
        ]
        await self.conn.executemany("""
            INSERT INTO price_snapshots(session_id, timestamp, coin_id, symbol, price, volume_24h, change_24h)
            VALUES (?,?,?,?,?,?,?)
        """, rows)
        await self.conn.commit()

    # ── Signals log ──────────────────────────────────────────

    async def save_signals(self, signals: list):
        if not self.session_id or not signals:
            return
        ts = time.time()
        rows = [
            (self.session_id, ts, s.coin_id, s.symbol, s.signal,
             s.strength, s.rsi, s.macd_signal, s.momentum_24h, s.strategy)
            for s in signals[:20]
        ]
        await self.conn.executemany("""
            INSERT INTO signals_log(session_id, timestamp, coin_id, symbol, signal,
                                    strength, rsi, macd_signal, momentum_24h, strategy)
            VALUES (?,?,?,?,?,?,?,?,?,?)
        """, rows)
        await self.conn.commit()

    # ── Query methods ────────────────────────────────────────

    async def get_all_sessions(self) -> List[dict]:
        async with self.conn.execute("""
            SELECT s.*,
                   COUNT(t.id) as trade_count,
                   COALESCE(SUM(CASE WHEN t.action='SELL' THEN t.pnl ELSE 0 END), 0) as realized_pnl
            FROM sessions s
            LEFT JOIN trades t ON t.session_id = s.id
            GROUP BY s.id
            ORDER BY s.started_at DESC
            LIMIT 50
        """) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]

    async def get_all_trades(self, session_id: str = None,
                              limit: int = 500) -> List[dict]:
        query  = "SELECT * FROM trades"
        params = []
        if session_id:
            query += " WHERE session_id=?"
            params.append(session_id)
        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        async with self.conn.execute(query, params) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]

    async def get_portfolio_history(self, session_id: str = None,
                                     limit: int = 1000) -> List[dict]:
        query  = "SELECT * FROM portfolio_snapshots"
        params = []
        if session_id:
            query += " WHERE session_id=?"
            params.append(session_id)
        query += " ORDER BY timestamp ASC LIMIT ?"
        params.append(limit)
        async with self.conn.execute(query, params) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]

    async def get_stats(self, session_id: str = None) -> dict:
        sid_filter = "WHERE session_id=?" if session_id else ""
        params = [session_id] if session_id else []

        async with self.conn.execute(f"""
            SELECT
                COUNT(*)                                               AS total_trades,
                SUM(CASE WHEN action='BUY'  THEN 1 ELSE 0 END)        AS buys,
                SUM(CASE WHEN action='SELL' THEN 1 ELSE 0 END)        AS sells,
                SUM(CASE WHEN action='SELL' AND pnl>0 THEN 1 ELSE 0 END) AS wins,
                SUM(CASE WHEN action='SELL' AND pnl<0 THEN 1 ELSE 0 END) AS losses,
                ROUND(SUM(fee), 4)                                     AS total_fees,
                ROUND(SUM(CASE WHEN action='SELL' THEN pnl ELSE 0 END), 4) AS realized_pnl,
                ROUND(AVG(CASE WHEN action='SELL' THEN pnl END), 4)    AS avg_pnl_per_trade,
                ROUND(MAX(CASE WHEN action='SELL' THEN pnl END), 4)    AS best_trade,
                ROUND(MIN(CASE WHEN action='SELL' THEN pnl END), 4)    AS worst_trade
            FROM trades {sid_filter}
        """, params) as cur:
            row = await cur.fetchone()
            stats = dict(row) if row else {}

        sells = stats.get('sells') or 0
        wins  = stats.get('wins')  or 0
        stats['win_rate'] = round((wins / sells * 100), 1) if sells > 0 else 0

        # Most traded coins
        async with self.conn.execute(f"""
            SELECT coin_id, symbol, COUNT(*) as count,
                   ROUND(SUM(CASE WHEN action='SELL' THEN pnl ELSE 0 END), 4) as pnl
            FROM trades {sid_filter}
            GROUP BY coin_id ORDER BY count DESC LIMIT 10
        """, params) as cur:
            rows = await cur.fetchall()
            stats['top_coins'] = [dict(r) for r in rows]

        # Strategy performance
        async with self.conn.execute(f"""
            SELECT strategy,
                   COUNT(*) as trades,
                   ROUND(SUM(CASE WHEN action='SELL' THEN pnl ELSE 0 END), 4) as pnl,
                   SUM(CASE WHEN action='SELL' AND pnl>0 THEN 1 ELSE 0 END) as wins
            FROM trades {sid_filter}
            WHERE strategy IS NOT NULL
            GROUP BY strategy ORDER BY pnl DESC
        """, params) as cur:
            rows = await cur.fetchall()
            stats['strategy_performance'] = [dict(r) for r in rows]

        return stats

    async def get_agent_logs(self, session_id: str = None,
                              limit: int = 200) -> List[dict]:
        query  = "SELECT * FROM agent_logs"
        params = []
        if session_id:
            query += " WHERE session_id=?"
            params.append(session_id)
        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        async with self.conn.execute(query, params) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]

    async def get_price_history(self, coin_id: str,
                                 session_id: str = None, limit: int = 100) -> List[dict]:
        query  = "SELECT * FROM price_snapshots WHERE coin_id=?"
        params = [coin_id]
        if session_id:
            query += " AND session_id=?"
            params.append(session_id)
        query += " ORDER BY timestamp DESC LIMIT ?"
        params.append(limit)
        async with self.conn.execute(query, params) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in reversed(rows)]

    # ── Historical prices (1-year archive) ──────────────────

    async def save_historical_prices(self, coin_id: str, symbol: str, data_points: list):
        """Store daily historical price data. Silently ignores duplicates."""
        rows = [
            (coin_id, symbol, d['ts'], d['price'], d.get('volume'), d.get('market_cap'))
            for d in data_points
        ]
        await self.conn.executemany("""
            INSERT OR IGNORE INTO historical_prices(coin_id, symbol, timestamp, price, volume, market_cap)
            VALUES (?,?,?,?,?,?)
        """, rows)
        await self.conn.commit()

    async def has_historical_data(self, coin_id: str) -> bool:
        async with self.conn.execute(
            "SELECT COUNT(*) FROM historical_prices WHERE coin_id=?", (coin_id,)
        ) as cur:
            row = await cur.fetchone()
            return (row[0] if row else 0) >= 30

    async def get_historical_prices(self, coin_id: str, limit: int = 365) -> List[dict]:
        async with self.conn.execute(
            "SELECT * FROM historical_prices WHERE coin_id=? ORDER BY timestamp ASC LIMIT ?",
            (coin_id, limit)
        ) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]

    async def get_forecast(self, coin_id: str) -> Optional[dict]:
        """Linear-regression + MA forecast from stored 365-day history."""
        history = await self.get_historical_prices(coin_id, limit=365)
        if len(history) < 14:
            return None
        prices = [h['price'] for h in history]
        current = prices[-1]

        def ma(n: int) -> float:
            pts = prices[-n:]
            return sum(pts) / len(pts) if pts else current

        ma7, ma30, ma90 = ma(7), ma(30), ma(min(90, len(prices)))

        window = prices[-30:]
        n = len(window)
        x_mean = (n - 1) / 2
        y_mean = sum(window) / n
        denom = sum((i - x_mean) ** 2 for i in range(n))
        slope = (
            sum((i - x_mean) * (window[i] - y_mean) for i in range(n)) / denom
            if denom else 0
        )

        f7  = current + slope * 7
        f30 = current + slope * 30

        def pct(target: float) -> float:
            return ((target - current) / current * 100) if current else 0

        if ma7 > ma30 > ma90:
            trend = 'bullish'
        elif ma7 < ma30 < ma90:
            trend = 'bearish'
        else:
            trend = 'neutral'

        return {
            'coin_id':          coin_id,
            'current':          current,
            'ma7':              round(ma7, 6),
            'ma30':             round(ma30, 6),
            'ma90':             round(ma90, 6),
            'trend':            trend,
            'forecast_7d':      round(f7, 6),
            'forecast_30d':     round(f30, 6),
            'forecast_7d_pct':  round(pct(f7), 2),
            'forecast_30d_pct': round(pct(f30), 2),
            'data_points':      len(history),
        }


# Global singleton
db = Database()
