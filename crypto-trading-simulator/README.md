# 🤖 Crypto AI Trader

> Simulador autónomo de trading de criptomonedas con 5 agentes IA, datos en tiempo real y dashboard interactivo.

[![Paper Trading](https://img.shields.io/badge/mode-Paper%20Trading-green)](.)
[![CoinGecko](https://img.shields.io/badge/data-CoinGecko%20Free-blue)](https://coingecko.com)
[![Claude Haiku](https://img.shields.io/badge/AI-Claude%20Haiku-purple)](https://anthropic.com)

---

## ¿Qué hace?

Simula un bot de trading con **$50 de capital inicial** que analiza 80+ criptomonedas en tiempo real, toma decisiones autónomas de compra/venta y te muestra todo en un dashboard en vivo.

**Sin inversión real** — conectado a precios reales, sin tocar ningún exchange.

---

## 5 Agentes Autónomos

| Agente | Rol | Descripción |
|--------|-----|-------------|
| 📡 **PriceFetcher** | Data Collector | Precios en tiempo real de CoinGecko (gratis, sin API key) |
| 📊 **TechnicalAnalyst** | Market Analyzer | RSI, MACD, Bollinger Bands, volume spikes |
| 🤖 **TradingBot** | Decision Maker | Compra/venta con sizing Kelly-inspired |
| 💼 **PortfolioManager** | Risk Manager | Stop-loss, take-profit, comisiones simuladas (0.1%) |
| 💬 **ARIA** | AI Analyst | Chat con Claude Haiku: ajusta parámetros, busca en internet |

---

## Inicio Rápido

```bash
# Clonar el repo
git clone https://github.com/jesparbem/trading-criptomonedas.git
cd trading-criptomonedas

# (Opcional) API key para el chat con ARIA
export ANTHROPIC_API_KEY=sk-ant-...

# Arrancar todo
./start.sh

# Abrir dashboard
open http://localhost:5173
```

---

## Stack Técnico

**Backend:** Python 3.11 · FastAPI · WebSockets · aiohttp · Anthropic SDK  
**Frontend:** React 18 · Vite · TailwindCSS · Recharts  
**Datos:** CoinGecko API (gratuita) · DuckDuckGo (búsqueda web)

---

## Modos de Trading

| Modo | Señal mínima | Posición máx | Stop Loss | Take Profit |
|------|-------------|--------------|-----------|-------------|
| 🛡️ Conservative | 72/100 | 20% | 5% | 15% |
| ⚖️ Balanced | 62/100 | 30% | 7% | 20% |
| 🔥 Aggressive | 52/100 | 40% | 10% | 35% |

Cambia de modo en tiempo real hablando con ARIA: *"Sé más agresivo"*

---

## Estructura del Proyecto

```
crypto-trading-simulator/
├── backend/
│   ├── main.py           # FastAPI + WebSocket + endpoints
│   ├── fetcher.py        # CoinGecko price fetcher
│   ├── analyzer.py       # RSI, MACD, Bollinger, signals
│   ├── trader.py         # Bot autónomo de trading
│   ├── portfolio.py      # Gestión de posiciones
│   ├── chat_agent.py     # ARIA — Claude Haiku agent
│   ├── config.py         # Parámetros dinámicos del bot
│   └── requirements.txt
├── frontend/
│   └── src/
│       └── components/   # Dashboard, Chat, Agents, Charts...
├── docs/
│   ├── index.html        # Documentación visual
│   └── CHANGELOG.md      # Historial de cambios
└── start.sh              # Arrancar con un comando
```

---

## Próximos pasos

- [ ] Conectar a exchange real (Binance/Kraken API)
- [ ] Backtesting histórico
- [ ] Notificaciones push de trades
- [ ] Exportar a CSV
- [ ] Comparativa vs Bitcoin

---

> ⚠️ **Solo para simulación.** No invierte dinero real. Úsalo para aprender y probar estrategias.
