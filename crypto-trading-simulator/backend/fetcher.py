import asyncio
import aiohttp
import time
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

COINGECKO_BASE = "https://api.coingecko.com/api/v3"

# Rate limit: free tier allows ~30 calls/minute
RATE_LIMIT_DELAY = 2.0  # seconds between calls

class PriceFetcher:
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.last_call_time = 0
        self.price_cache: Dict[str, float] = {}
        self.market_data: Dict[str, dict] = {}
        self.price_history: Dict[str, List[float]] = {}  # coin_id -> list of prices
        self.trending_coins: List[dict] = []
        self.all_coins: List[dict] = []
        self.last_full_update = 0

    async def _get_session(self) -> aiohttp.ClientSession:
        if not self.session or self.session.closed:
            headers = {
                'Accept': 'application/json',
                'User-Agent': 'CryptoTradingSimulator/1.0'
            }
            self.session = aiohttp.ClientSession(headers=headers)
        return self.session

    async def _rate_limited_get(self, url: str, params: dict = None) -> Optional[dict]:
        """Make a rate-limited GET request."""
        now = time.time()
        elapsed = now - self.last_call_time
        if elapsed < RATE_LIMIT_DELAY:
            await asyncio.sleep(RATE_LIMIT_DELAY - elapsed)

        self.last_call_time = time.time()

        try:
            session = await self._get_session()
            async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as resp:
                if resp.status == 200:
                    return await resp.json()
                elif resp.status == 429:
                    logger.warning("Rate limited by CoinGecko, waiting 60s...")
                    await asyncio.sleep(60)
                    return None
                else:
                    logger.warning(f"CoinGecko returned status {resp.status}")
                    return None
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            return None

    async def fetch_top_coins(self, limit: int = 80) -> List[dict]:
        """Fetch top coins by volume."""
        data = await self._rate_limited_get(
            f"{COINGECKO_BASE}/coins/markets",
            params={
                'vs_currency': 'usd',
                'order': 'volume_desc',
                'per_page': limit,
                'page': 1,
                'sparkline': 'false',
                'price_change_percentage': '1h,24h,7d'
            }
        )
        if data:
            self.all_coins = data
            for coin in data:
                self.market_data[coin['id']] = coin
                self.price_cache[coin['id']] = coin['current_price']

                # Track price history
                if coin['id'] not in self.price_history:
                    self.price_history[coin['id']] = []
                self.price_history[coin['id']].append(coin['current_price'])
                # Keep last 100 prices
                if len(self.price_history[coin['id']]) > 100:
                    self.price_history[coin['id']] = self.price_history[coin['id']][-100:]

        return data or []

    async def fetch_trending(self) -> List[dict]:
        """Fetch trending coins - potential high growth opportunities."""
        data = await self._rate_limited_get(f"{COINGECKO_BASE}/search/trending")
        if data and 'coins' in data:
            self.trending_coins = [item['item'] for item in data['coins']]
            return self.trending_coins
        return []

    async def fetch_new_coins(self) -> List[dict]:
        """Fetch recently added coins with potential for high growth."""
        # Get coins with small market cap but high volume (potential 300%+ gainers)
        data = await self._rate_limited_get(
            f"{COINGECKO_BASE}/coins/markets",
            params={
                'vs_currency': 'usd',
                'order': 'percent_change_24h_desc',
                'per_page': 50,
                'page': 3,  # Page 3 gives us smaller cap coins
                'sparkline': 'false',
                'price_change_percentage': '1h,24h,7d'
            }
        )
        return data or []

    async def fetch_coin_history(self, coin_id: str, days: int = 1) -> List[float]:
        """Fetch hourly price history for a coin."""
        data = await self._rate_limited_get(
            f"{COINGECKO_BASE}/coins/{coin_id}/market_chart",
            params={
                'vs_currency': 'usd',
                'days': days,
                'interval': 'hourly' if days <= 7 else 'daily'
            }
        )
        if data and 'prices' in data:
            prices = [p[1] for p in data['prices']]
            self.price_history[coin_id] = prices[-50:]  # Keep last 50 points
            return prices
        return []

    def get_current_price(self, coin_id: str) -> Optional[float]:
        return self.price_cache.get(coin_id)

    def get_all_prices(self) -> Dict[str, float]:
        return dict(self.price_cache)

    def get_market_data(self, coin_id: str) -> Optional[dict]:
        return self.market_data.get(coin_id)

    def get_price_history(self, coin_id: str) -> List[float]:
        return self.price_history.get(coin_id, [])

    async def close(self):
        if self.session and not self.session.closed:
            await self.session.close()
