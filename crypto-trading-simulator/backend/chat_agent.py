import json
import os
import time
import aiohttp
import asyncio
from typing import AsyncIterator, List, Dict, Any
import anthropic

SYSTEM_PROMPT = """Eres ARIA (Autonomous Risk & Investment Agent) — un analista de trading de criptomonedas de élite y controlador de bots.

Tienes acceso en tiempo real a:
- Portfolio actual (capital, posiciones abiertas, P&L, historial de trades)
- Señales de mercado para 80+ criptomonedas con indicadores técnicos (RSI, MACD, Bollinger)
- Capacidad de modificar el comportamiento del bot de trading en tiempo real
- Búsqueda web para noticias y análisis crypto actuales

Tu objetivo principal: MAXIMIZAR el retorno de la inversión.

Directrices de comportamiento:
- Responde siempre en el idioma del usuario (español o inglés según corresponda)
- Sé directo, analítico y data-driven. No divagues.
- Cuando recomiendas una acción, ejecuta la herramienta correspondiente inmediatamente
- Si el usuario pide "más agresivo", ajusta los parámetros y dilo explícitamente
- Siempre muestra números concretos: precios, porcentajes, P&L exactos
- Cuando analices oportunidades, cita el RSI, MACD y momentum específicamente
- Para búsquedas web, usa términos en inglés para mejores resultados

Formato de respuestas: corto y preciso. Usa bullet points para listas. Nunca más de 300 palabras a menos que se pida análisis detallado."""

TOOLS = [
    {
        "name": "get_portfolio_state",
        "description": "Obtiene el estado actual del portfolio: saldo, posiciones abiertas, P&L, historial de trades y estadísticas",
        "input_schema": {"type": "object", "properties": {}, "required": []}
    },
    {
        "name": "get_market_signals",
        "description": "Obtiene las señales de mercado y análisis técnico de todas las criptomonedas monitoreadas",
        "input_schema": {
            "type": "object",
            "properties": {
                "filter": {
                    "type": "string",
                    "enum": ["ALL", "BUY", "STRONG_BUY", "SELL", "STRONG_SELL", "HOLD"],
                    "description": "Filtrar señales por tipo"
                },
                "limit": {"type": "integer", "description": "Número máximo de resultados (default 10)"}
            },
            "required": []
        }
    },
    {
        "name": "adjust_trading_params",
        "description": "Modifica los parámetros del bot de trading en tiempo real para cambiar su comportamiento",
        "input_schema": {
            "type": "object",
            "properties": {
                "mode": {
                    "type": "string",
                    "enum": ["conservative", "balanced", "aggressive"],
                    "description": "Preset de modo: conservative (bajo riesgo), balanced (normal), aggressive (alto riesgo/retorno)"
                },
                "min_signal_strength": {
                    "type": "number",
                    "description": "Fuerza mínima de señal para comprar (0-100, default 62). Menor = más trades."
                },
                "max_position_size_pct": {
                    "type": "number",
                    "description": "% máximo del portfolio por posición (0-1, default 0.30)"
                },
                "max_positions": {
                    "type": "integer",
                    "description": "Máximo de posiciones abiertas simultáneas (default 5)"
                },
                "default_stop_loss_pct": {
                    "type": "number",
                    "description": "Stop loss por defecto en % (default 0.07 = 7%)"
                },
                "default_take_profit_pct": {
                    "type": "number",
                    "description": "Take profit por defecto en % (default 0.20 = 20%)"
                }
            },
            "required": []
        }
    },
    {
        "name": "force_sell",
        "description": "Fuerza la venta inmediata de una posición abierta específica",
        "input_schema": {
            "type": "object",
            "properties": {
                "coin_id": {
                    "type": "string",
                    "description": "ID de la moneda a vender (ej: 'bitcoin', 'ethereum', 'solana')"
                }
            },
            "required": ["coin_id"]
        }
    },
    {
        "name": "pause_trading",
        "description": "Pausa o reanuda el bot de trading",
        "input_schema": {
            "type": "object",
            "properties": {
                "pause": {"type": "boolean", "description": "true para pausar, false para reanudar"}
            },
            "required": ["pause"]
        }
    },
    {
        "name": "web_search",
        "description": "Busca información actualizada en internet sobre criptomonedas, noticias, análisis o cualquier tema relevante",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Término de búsqueda (en inglés para mejores resultados)"
                }
            },
            "required": ["query"]
        }
    }
]


class ChatAgent:
    def __init__(self):
        self.client = None
        self._trader_ref = None
        self._portfolio_ref = None
        self._fetcher_ref = None
        self._config_ref = None

    def initialize(self, trader, portfolio, fetcher, config):
        self._trader_ref = trader
        self._portfolio_ref = portfolio
        self._fetcher_ref = fetcher
        self._config_ref = config
        api_key = os.environ.get('ANTHROPIC_API_KEY', '')
        if api_key:
            self.client = anthropic.AsyncAnthropic(api_key=api_key)

    def _build_context_summary(self) -> str:
        if not self._portfolio_ref or not self._fetcher_ref:
            return ""
        prices = self._fetcher_ref.get_all_prices()
        p = self._portfolio_ref
        total = p.total_value(prices)
        pnl = p.total_pnl(prices)
        pnl_pct = p.total_pnl_pct(prices)
        pos_count = len(p.positions)
        cfg = self._config_ref

        return f"""
ESTADO ACTUAL DEL PORTFOLIO (actualizado ahora mismo):
- Valor total: ${total:.2f} | P&L: ${pnl:+.2f} ({pnl_pct:+.2f}%)
- Efectivo disponible: ${p.cash:.2f}
- Posiciones abiertas: {pos_count}/{cfg.max_positions}
- Modo de trading: {cfg.mode} | Fuerza mínima señal: {cfg.min_signal_strength}
- Bot: {'PAUSADO' if cfg.is_paused else 'ACTIVO'} | Ciclo #{self._trader_ref.cycle_count if self._trader_ref else 0}
"""

    async def _execute_tool(self, name: str, input_data: dict) -> str:
        try:
            if name == "get_portfolio_state":
                return self._tool_portfolio()
            elif name == "get_market_signals":
                return self._tool_signals(input_data.get("filter", "ALL"), input_data.get("limit", 10))
            elif name == "adjust_trading_params":
                return self._tool_adjust_params(input_data)
            elif name == "force_sell":
                return await self._tool_force_sell(input_data.get("coin_id", ""))
            elif name == "pause_trading":
                return self._tool_pause(input_data.get("pause", True))
            elif name == "web_search":
                return await self._tool_web_search(input_data.get("query", ""))
            else:
                return f"Herramienta '{name}' no encontrada"
        except Exception as e:
            return f"Error ejecutando {name}: {str(e)}"

    def _tool_portfolio(self) -> str:
        if not self._portfolio_ref:
            return "Portfolio no disponible"
        prices = self._fetcher_ref.get_all_prices() if self._fetcher_ref else {}
        p = self._portfolio_ref
        total = p.total_value(prices)
        pnl = p.total_pnl(prices)
        pnl_pct = p.total_pnl_pct(prices)

        lines = [
            f"PORTFOLIO SNAPSHOT",
            f"Valor: ${total:.2f} (inicio: $50.00)",
            f"P&L: ${pnl:+.2f} ({pnl_pct:+.2f}%)",
            f"Efectivo: ${p.cash:.2f}",
            f"Fees totales pagados: ${p.total_fees_paid:.3f}",
            f"Total trades: {len(p.trades)}",
            "",
            "POSICIONES ABIERTAS:"
        ]
        if p.positions:
            for cid, pos in p.positions.items():
                price = prices.get(cid, pos.entry_price)
                pnl_pos = pos.pnl(price)
                pnl_pos_pct = pos.pnl_pct(price)
                lines.append(
                    f"  {pos.symbol}: {pnl_pos:+.2f}$ ({pnl_pos_pct:+.1f}%) "
                    f"| entrada ${pos.entry_price:.4f} → actual ${price:.4f} "
                    f"| SL: ${pos.stop_loss:.4f} | TP: ${pos.take_profit:.4f}"
                )
        else:
            lines.append("  Sin posiciones abiertas")

        lines.append("")
        lines.append("ÚLTIMOS 5 TRADES:")
        for t in list(reversed(p.trades))[:5]:
            ts = time.strftime('%H:%M:%S', time.localtime(t.timestamp))
            pnl_str = f" PnL: ${t.pnl:+.2f}" if t.action == 'SELL' else ""
            lines.append(f"  [{ts}] {t.action} {t.symbol} @ ${t.price:.4f} (${t.total_value:.2f}){pnl_str}")

        return "\n".join(lines)

    def _tool_signals(self, filter_type: str = "ALL", limit: int = 10) -> str:
        if not self._trader_ref:
            return "Señales no disponibles"
        signals = self._trader_ref.current_signals
        if filter_type != "ALL":
            signals = [s for s in signals if s.signal == filter_type]
        signals = signals[:limit]

        if not signals:
            return f"No hay señales de tipo {filter_type}"

        lines = [f"SEÑALES DE MERCADO ({filter_type}, {len(signals)} resultados):"]
        for s in signals:
            lines.append(
                f"\n{s.symbol} [{s.signal}] fuerza={s.strength:.0f}%"
                f"\n  Precio: ${s.current_price:.4f}"
                f"\n  RSI: {s.rsi:.1f if s.rsi else 'N/A'} | MACD: {s.macd_signal or 'N/A'}"
                f"\n  1h: {s.momentum_1h:+.1f}% | 24h: {s.momentum_24h:+.1f}% | 7d: {s.momentum_7d:+.1f}%"
                f"\n  {'🔊 Volume spike' if s.volume_spike else ''}"
                f"\n  Razones: {', '.join(s.reasons[:3])}"
            )
        return "\n".join(lines)

    def _tool_adjust_params(self, params: dict) -> str:
        if not self._config_ref:
            return "Config no disponible"
        cfg = self._config_ref
        old = cfg.to_dict()

        if "mode" in params:
            cfg.apply_mode(params["mode"])
        else:
            for key in ["min_signal_strength", "max_position_size_pct", "max_positions",
                        "default_stop_loss_pct", "default_take_profit_pct"]:
                if key in params and params[key] is not None:
                    setattr(cfg, key, params[key])

        new = cfg.to_dict()
        changes = [f"{k}: {old[k]} → {new[k]}" for k in new if old.get(k) != new.get(k)]

        if self._trader_ref:
            self._trader_ref._log(
                f"⚙️ Chat ajustó parámetros: {', '.join(changes)}",
                action="CONFIG"
            )
        return f"Parámetros actualizados:\n" + "\n".join(f"  {c}" for c in changes) if changes else "Sin cambios"

    async def _tool_force_sell(self, coin_id: str) -> str:
        if not self._trader_ref or not self._portfolio_ref or not self._fetcher_ref:
            return "Sistema no disponible"
        prices = self._fetcher_ref.get_all_prices()
        price = prices.get(coin_id)
        if not price:
            return f"No se encontró precio para {coin_id}"
        if coin_id not in self._portfolio_ref.positions:
            return f"{coin_id} no está en posiciones abiertas"
        trade = self._portfolio_ref.sell(coin_id, price, "Venta manual via chat", "CHAT_MANUAL")
        if trade:
            self._trader_ref._log(
                f"💬 Chat forzó venta: {trade.symbol} @ ${price:.4f} | PnL: ${trade.pnl:+.2f}",
                action="SELL"
            )
            return f"Vendido {trade.symbol} @ ${price:.4f} | PnL: ${trade.pnl:+.2f}"
        return f"No se pudo vender {coin_id}"

    def _tool_pause(self, pause: bool) -> str:
        if not self._config_ref:
            return "Config no disponible"
        self._config_ref.is_paused = pause
        status = "PAUSADO" if pause else "REANUDADO"
        if self._trader_ref:
            self._trader_ref._log(f"💬 Chat: Bot {status}", action="PAUSE" if pause else "RESUME")
        return f"Bot de trading {status}"

    async def _tool_web_search(self, query: str) -> str:
        try:
            url = "https://api.duckduckgo.com/"
            params = {"q": query, "format": "json", "no_html": "1", "skip_disambig": "1"}
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=8)) as resp:
                    data = await resp.json(content_type=None)

            results = []
            if data.get("Abstract"):
                results.append(f"Resumen: {data['Abstract'][:400]}")
            if data.get("Answer"):
                results.append(f"Respuesta directa: {data['Answer']}")
            if data.get("RelatedTopics"):
                for t in data["RelatedTopics"][:4]:
                    if isinstance(t, dict) and t.get("Text"):
                        results.append(f"• {t['Text'][:250]}")

            if results:
                return f"Resultados para '{query}':\n" + "\n".join(results)
            return f"Sin resultados instantáneos para '{query}'. Intenta con términos más específicos en inglés."
        except Exception as e:
            return f"Error en búsqueda: {str(e)}"

    async def chat_stream(self, message: str, history: list) -> AsyncIterator[str]:
        if not self.client:
            yield f"data: {json.dumps({'type': 'error', 'content': 'ANTHROPIC_API_KEY no configurada. Añade la variable de entorno.'})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            return

        context_summary = self._build_context_summary()
        system = SYSTEM_PROMPT + "\n\n" + context_summary

        messages = list(history) + [{"role": "user", "content": message}]
        max_iterations = 6

        for _ in range(max_iterations):
            tool_uses = []
            current_tool_id = None
            current_tool_name = None
            current_tool_json = ""
            stop_reason = "end_turn"

            try:
                async with self.client.messages.stream(
                    model="claude-haiku-4-5-20251001",
                    max_tokens=1500,
                    system=system,
                    messages=messages,
                    tools=TOOLS
                ) as stream:
                    async for event in stream:
                        if event.type == "content_block_start":
                            cb = event.content_block
                            if cb.type == "tool_use":
                                current_tool_id = cb.id
                                current_tool_name = cb.name
                                current_tool_json = ""
                                yield f"data: {json.dumps({'type': 'tool_call', 'name': cb.name})}\n\n"

                        elif event.type == "content_block_delta":
                            d = event.delta
                            if d.type == "text_delta":
                                yield f"data: {json.dumps({'type': 'text', 'chunk': d.text})}\n\n"
                            elif d.type == "input_json_delta":
                                current_tool_json += d.partial_json

                        elif event.type == "content_block_stop":
                            if current_tool_id:
                                try:
                                    input_data = json.loads(current_tool_json) if current_tool_json.strip() else {}
                                except Exception:
                                    input_data = {}
                                tool_uses.append({
                                    "id": current_tool_id,
                                    "name": current_tool_name,
                                    "input": input_data
                                })
                                current_tool_id = None
                                current_tool_name = None
                                current_tool_json = ""

                    final_msg = await stream.get_final_message()
                    stop_reason = final_msg.stop_reason

            except anthropic.APIError as e:
                yield f"data: {json.dumps({'type': 'error', 'content': f'Error API: {str(e)}'})}\n\n"
                break

            if stop_reason == "tool_use" and tool_uses:
                tool_results = []
                for tool in tool_uses:
                    result = await self._execute_tool(tool["name"], tool.get("input", {}))
                    yield f"data: {json.dumps({'type': 'tool_result', 'name': tool['name'], 'result': result[:400]})}\n\n"
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": tool["id"],
                        "content": result
                    })
                messages.append({"role": "assistant", "content": final_msg.content})
                messages.append({"role": "user", "content": tool_results})
            else:
                break

        yield f"data: {json.dumps({'type': 'done'})}\n\n"


# Global instance — initialized in main.py
chat_agent = ChatAgent()
