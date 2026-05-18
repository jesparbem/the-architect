import asyncio
import json
import logging
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from fetcher import PriceFetcher
from analyzer import TechnicalAnalyzer
from trader import TradingAgent
from portfolio import Portfolio

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

CYCLE_INTERVAL = 90  # seconds between trading cycles (90s = ~real-time feel)


async def broadcast(data: dict):
    """Send data to all connected WebSocket clients."""
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
    """Main trading loop - runs continuously."""
    agent.is_running = True
    logger.info("Trading loop started!")

    while agent.is_running:
        try:
            await agent.run_cycle()
            state = agent.get_state()
            await broadcast({'type': 'state_update', 'data': state})
        except Exception as e:
            logger.error(f"Error in trading loop: {e}")

        # Wait for next cycle
        await asyncio.sleep(CYCLE_INTERVAL)


@app.on_event("startup")
async def startup():
    global trading_task
    logger.info("Starting crypto trading simulator...")
    trading_task = asyncio.create_task(trading_loop())


@app.on_event("shutdown")
async def shutdown():
    agent.is_running = False
    if trading_task:
        trading_task.cancel()
    await fetcher.close()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.add(websocket)
    logger.info(f"New WebSocket client. Total: {len(connected_clients)}")

    try:
        # Send current state immediately
        state = agent.get_state()
        await websocket.send_text(json.dumps({'type': 'state_update', 'data': state}))

        # Keep connection alive
        while True:
            try:
                msg = await asyncio.wait_for(websocket.receive_text(), timeout=30)
                if msg == 'ping':
                    await websocket.send_text(json.dumps({'type': 'pong'}))
            except asyncio.TimeoutError:
                await websocket.send_text(json.dumps({'type': 'heartbeat', 'ts': time.time()}))
    except WebSocketDisconnect:
        connected_clients.discard(websocket)
        logger.info(f"Client disconnected. Total: {len(connected_clients)}")
    except Exception as e:
        connected_clients.discard(websocket)
        logger.error(f"WebSocket error: {e}")


@app.get("/api/state")
async def get_state():
    return JSONResponse(agent.get_state())


@app.get("/api/portfolio")
async def get_portfolio():
    prices = fetcher.get_all_prices()
    return JSONResponse(portfolio.to_dict(prices))


@app.post("/api/reset")
async def reset_portfolio():
    global portfolio, agent
    portfolio = Portfolio()
    agent.portfolio = portfolio
    agent.cycle_count = 0
    agent.day_count = 1
    agent._log("Portfolio reset to $50.00", action="RESET")
    return JSONResponse({"status": "reset", "cash": 50.0})


@app.get("/health")
async def health():
    return {"status": "ok", "cycle": agent.cycle_count}
