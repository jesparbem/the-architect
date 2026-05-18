import asyncio
import json
import logging
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import List

from fetcher import PriceFetcher
from analyzer import TechnicalAnalyzer
from trader import TradingAgent
from portfolio import Portfolio
from config import trading_config
from chat_agent import chat_agent
from database import db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Crypto Trading Simulator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
portfolio = Portfolio()
fetcher = PriceFetcher()
analyzer = TechnicalAnalyzer()
agent = TradingAgent(portfolio, fetcher, analyzer)
connected_clients = set()
trading_task = None

CYCLE_INTERVAL = 90


# Agent registry — describes all autonomous agents running in the system
AGENT_REGISTRY = [
    {
        "id": "price_fetcher",
        "name": "PriceFetcher",
        "role": "Data Collector",
        "description": "Obtiene precios en tiempo real de CoinGecko API para 80+ criptomonedas",
        "icon": "📡",
        "color": "blue",
        "interval_s": CYCLE_INTERVAL,
    },
    {
        "id": "technical_analyst",
        "name": "TechnicalAnalyst",
        "role": "Market Analyzer",
        "description": "Calcula RSI, MACD, Bollinger Bands y detecta volume spikes para generar señales",
        "icon": "📊",
        "color": "purple",
        "interval_s": CYCLE_INTERVAL,
    },
    {
        "id": "trading_bot",
        "name": "TradingBot",
        "role": "Decision Maker",
        "description": "Toma decisiones de compra/venta con sizing Kelly-inspired y gestión de riesgo automática",
        "icon": "🤖",
        "color": "green",
        "interval_s": CYCLE_INTERVAL,
    },
    {
        "id": "portfolio_manager",
        "name": "PortfolioManager",
        "role": "Risk Manager",
        "description": "Gestiona posiciones, stop-loss, take-profit y simula comisiones de exchange (0.1%)",
        "icon": "💼",
        "color": "yellow",
        "interval_s": 10,
    },
    {
        "id": "aria_chat",
        "name": "ARIA",
        "role": "AI Analyst",
        "description": "Agente de IA conversacional (Claude Haiku). Responde preguntas, ajusta parámetros y busca en internet",
        "icon": "💬",
        "color": "pink",
        "interval_s": None,  # On-demand
    },
]


async def broadcast(data: dict):
    if not connected_clients:
        return
    message = json.dumps(data)
    dead = set()
    for ws in connected_clients:
        try:
            await ws.send_text(message)
        except Exception:
            dead.add(ws)
    connected_clients.difference_update(dead)


async def trading_loop():
    agent.is_running = True
    logger.info("Trading loop started!")

    while agent.is_running:
        try:
            await agent.run_cycle()
            state = agent.get_state()
            state['agents'] = _get_agent_statuses()
            await broadcast({'type': 'state_update', 'data': state})
        except Exception as e:
            logger.error(f"Error in trading loop: {e}")

        await asyncio.sleep(CYCLE_INTERVAL)


def _get_agent_statuses() -> list:
    statuses = []
    for a in AGENT_REGISTRY:
        status = dict(a)
        if a['id'] == 'price_fetcher':
            status['status'] = 'active'
            status['last_run'] = fetcher.last_call_time
            status['stats'] = f"{len(fetcher.price_cache)} coins tracked"
        elif a['id'] == 'technical_analyst':
            status['status'] = 'active'
            status['stats'] = f"{len(agent.current_signals)} signals generated"
        elif a['id'] == 'trading_bot':
            status['status'] = 'paused' if trading_config.is_paused else 'active'
            status['stats'] = f"Cycle #{agent.cycle_count} | Mode: {trading_config.mode}"
        elif a['id'] == 'portfolio_manager':
            status['status'] = 'active'
            prices = fetcher.get_all_prices()
            val = portfolio.total_value(prices)
            status['stats'] = f"${val:.2f} | {len(portfolio.positions)} positions"
        elif a['id'] == 'aria_chat':
            has_key = bool(chat_agent.client)
            status['status'] = 'active' if has_key else 'waiting'
            status['stats'] = 'Ready' if has_key else 'API key needed'
        statuses.append(status)
    return statuses


async def _fetch_historical_bg():
    """Background task: fetch 365-day price history for top coins after first cycle."""
    await asyncio.sleep(35)  # Wait for first market data to be available
    if fetcher.all_coins:
        logger.info("Starting background historical data fetch...")
        await fetcher.fetch_historical_bulk(fetcher.all_coins, db, max_coins=25)
        logger.info("Background historical data fetch complete")


@app.on_event("startup")
async def startup():
    global trading_task
    logger.info("Starting crypto trading simulator...")

    # Initialize persistent database
    await db.connect()
    await db.new_session()

    # Wire DB into portfolio and trading agent
    portfolio.set_db(db)
    agent.set_db(db)

    chat_agent.initialize(agent, portfolio, fetcher, trading_config)
    trading_task = asyncio.create_task(trading_loop())

    # Kick off historical data fetch in background (non-blocking)
    asyncio.create_task(_fetch_historical_bg())


@app.on_event("shutdown")
async def shutdown():
    agent.is_running = False
    if trading_task:
        trading_task.cancel()
    prices = fetcher.get_all_prices()
    await db.end_session(portfolio.total_value(prices))
    await db.close()
    await fetcher.close()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)

    try:
        state = agent.get_state()
        state['agents'] = _get_agent_statuses()
        await websocket.send_text(json.dumps({'type': 'state_update', 'data': state}))

        while True:
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                if msg == 'ping':
                    await websocket.send_text(json.dumps({'type': 'pong'}))
            except asyncio.TimeoutError:
                await websocket.send_text(json.dumps({'type': 'heartbeat', 'ts': time.time()}))
    except WebSocketDisconnect:
        connected_clients.discard(websocket)
    except Exception as e:
        connected_clients.discard(websocket)
        logger.error(f"WebSocket error: {e}")


# ── Chat endpoint ────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    history = [{"role": m.role, "content": m.content} for m in req.history]

    async def generate():
        async for chunk in chat_agent.chat_stream(req.message, history):
            yield chunk

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


# ── REST endpoints ───────────────────────────────────────────────────────────

@app.get("/api/state")
async def get_state():
    state = agent.get_state()
    state['agents'] = _get_agent_statuses()
    return JSONResponse(state)


@app.get("/api/portfolio")
async def get_portfolio():
    prices = fetcher.get_all_prices()
    return JSONResponse(portfolio.to_dict(prices))


@app.get("/api/agents")
async def get_agents():
    return JSONResponse(_get_agent_statuses())


@app.post("/api/reset")
async def reset_portfolio():
    global portfolio, agent
    # Close out current session
    prices = fetcher.get_all_prices()
    await db.end_session(portfolio.total_value(prices))

    portfolio = Portfolio()
    portfolio.set_db(db)
    agent.portfolio = portfolio
    chat_agent._portfolio_ref = portfolio
    agent.cycle_count = 0
    agent.day_count = 1

    # Open a fresh session for the new run
    await db.new_session()
    agent._log("Portfolio reset to $50.00", action="RESET")
    return JSONResponse({"status": "reset", "cash": 50.0, "session_id": db.session_id})


# ── History / stats endpoints ────────────────────────────────────────────────

@app.get("/api/history/trades")
async def history_trades(session_id: str = None, limit: int = 200):
    trades = await db.get_all_trades(session_id=session_id, limit=limit)
    return JSONResponse(trades)


@app.get("/api/history/portfolio")
async def history_portfolio(session_id: str = None, limit: int = 500):
    history = await db.get_portfolio_history(session_id=session_id, limit=limit)
    return JSONResponse(history)


@app.get("/api/stats")
async def stats(session_id: str = None):
    s = await db.get_stats(session_id=session_id)
    return JSONResponse(s)


@app.get("/api/sessions")
async def get_sessions():
    s = await db.get_all_sessions()
    return JSONResponse(s)


@app.get("/api/history/prices/{coin_id}")
async def history_prices(coin_id: str, limit: int = 100):
    prices = await db.get_price_history(coin_id, session_id=db.session_id, limit=limit)
    return JSONResponse(prices)


@app.get("/api/historical/{coin_id}")
async def historical_prices(coin_id: str, limit: int = 365):
    prices = await db.get_historical_prices(coin_id, limit=limit)
    return JSONResponse(prices)


@app.get("/api/forecast/{coin_id}")
async def forecast_coin(coin_id: str):
    result = await db.get_forecast(coin_id)
    if result is None:
        return JSONResponse(
            {"error": "Not enough historical data", "coin_id": coin_id},
            status_code=404
        )
    return JSONResponse(result)


@app.get("/api/logs")
async def get_logs(session_id: str = None, limit: int = 200):
    logs = await db.get_agent_logs(session_id=session_id, limit=limit)
    return JSONResponse(logs)


@app.get("/health")
async def health():
    return {"status": "ok", "cycle": agent.cycle_count, "session": db.session_id}
