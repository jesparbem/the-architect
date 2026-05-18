# Crypto AI Trader — Changelog

> Registro completo de todos los cambios y evolución del proyecto.  
> Este fichero alimenta la documentación HTML generada automáticamente.

---

## [v1.2.0] — 2026-05-18 · Chat Agent + Agents Panel

### Añadido
- **Agente ARIA** (Autonomous Risk & Investment Agent) — chat IA impulsado por Claude Haiku
  - Endpoint SSE streaming: `POST /api/chat`
  - 6 herramientas: `get_portfolio`, `get_market_signals`, `adjust_trading_params`, `force_sell`, `pause_trading`, `web_search`
  - Búsqueda web vía DuckDuckGo API (sin API key)
  - Contexto en tiempo real del portfolio en cada mensaje
- **Panel de Agentes** (`AgentsPanel.jsx`) — muestra los 5 agentes autónomos del sistema con estado en tiempo real
- **Config dinámica** (`config.py`) — parámetros del bot ajustables en tiempo real desde el chat
  - Modos: `conservative`, `balanced`, `aggressive`
  - Ajuste manual: signal strength, stop loss, take profit, max posiciones
- **Endpoint** `GET /api/agents` para estado de todos los agentes
- **Registro de agentes** en el servidor con estadísticas live
- **Indicador de modo** en el header del dashboard
- **Botón PAUSADO** cuando el bot está detenido

### Modificado
- `trader.py` — usa `trading_config` en vez de constantes hardcoded
- `main.py` — añadidos endpoints `/api/chat`, `/api/agents`, inicialización del agente chat
- `Dashboard.jsx` — integra `ChatPanel` y `AgentsPanel`

---

## [v1.1.0] — 2026-05-18 · Simulador Base Completo

### Añadido
- **Backend Python/FastAPI** con WebSocket en tiempo real
- **PriceFetcher** — CoinGecko API gratis, 80+ coins, sin API key
- **TechnicalAnalyzer** — RSI (14), MACD (12/26/9), Bollinger Bands (20), volume spikes
- **TradingBot** — decisiones autónomas con sizing Kelly-inspired
- **PortfolioManager** — gestión de posiciones con stop-loss y take-profit automáticos
- **Simulación de comisiones** — 0.1% por operación + 0.05% slippage
- **Frontend React** con Vite + TailwindCSS + Recharts
  - `PortfolioCard` — 6 métricas + barra de progreso + posiciones activas
  - `PerformanceChart` — gráfico de área con baseline en $50
  - `PriceTable` — 15 coins con RSI, momentum, señales
  - `TradeHistory` — historial con W/L y P&L realizado
  - `AgentLog` — log de decisiones del bot en tiempo real
- **Capital inicial**: $50 USD
- **Estrategias**: RSI_OVERSOLD, MACD_CROSSOVER, VOLUME_BREAKOUT, MOMENTUM, COMPOSITE
- **Reset de portfolio** vía botón y `POST /api/reset`

---

## Roadmap Pendiente

- [ ] Conectar a exchange real (Binance/Kraken API) en modo producción
- [ ] Backtesting histórico con datos de hasta 365 días
- [ ] Notificaciones push cuando se ejecuta un trade importante
- [ ] Exportar historial de trades a CSV
- [ ] Comparativa de rendimiento vs Bitcoin (benchmark)
- [ ] Dashboard móvil optimizado
