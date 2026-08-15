# PaperMoon 🌙

Simulador de **paper-trading** de criptomonedas: datos de mercado **reales en vivo** (Binance), cartera **100% virtual**. Sin dinero real, sin custodia, sin KYC.

Terminal de trading estilo Binance/TradingView para practicar sin riesgo — construido a partir del blueprint en [`../output/papermoon-blueprint.md`](../output/papermoon-blueprint.md).

![stack](https://img.shields.io/badge/Next.js-15-black) ![ts](https://img.shields.io/badge/TypeScript-strict-blue) ![tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8)

---

## Arranque rápido

```bash
pnpm install
pnpm dev
# abre http://localhost:3000
```

**No necesita ninguna variable de entorno para funcionar.** La cartera se persiste en el navegador (localStorage).

## ¿Qué incluye este MVP ejecutable?

- 📈 **Datos reales en vivo** desde la API pública de Binance (REST klines + WebSocket de precios), sin API key.
- 🕯️ **Gráfico de velas** profesional con TradingView Lightweight Charts, con la vela en formación actualizándose en vivo.
- 💸 **Motor de paper-trading** con aritmética decimal exacta (`decimal.js`): órdenes de mercado, coste medio, PnL realizado y no realizado, comisiones.
- 💼 **Cartera de $100.000 virtuales** persistida en el navegador — sobrevive a recargas. Botón de reset.
- 📊 **Dashboard** con equity, distribución (pie), curva de equity y actividad reciente.
- 🎨 **Diseño dark-first** de terminal financiero, con flash de precio verde/rojo y modo daltónico-safe (color + signo + flecha).

### Feed resiliente (modo demo automático)

Si el exchange no es accesible (redes restringidas, geo-bloqueo, offline), la app cambia **automáticamente** a un **feed sintético** (random-walk determinista anclado a precios base) para que todo siga funcionando. El indicador de la barra superior muestra **EN VIVO** o **DEMO**.

- Forzar demo: `NEXT_PUBLIC_DEMO_MODE=true`
- Endpoint regional (p.ej. Binance.US): `NEXT_PUBLIC_BINANCE_REST_URL` / `NEXT_PUBLIC_BINANCE_WS_URL`

## Comandos

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Servir el build |
| `pnpm test` | Tests unitarios del motor de trading (Vitest) |
| `pnpm typecheck` | Comprobación de tipos |

## Arquitectura (resumen)

```
src/
  app/
    (app)/            # dashboard, markets, trade/[symbol], portfolio, orders
    api/market/       # proxies REST a Binance (con fallback sintético)
  components/         # ui, shared, trade, markets, portfolio, app-shell
  lib/
    trading/engine.ts # NÚCLEO: fills, coste medio, PnL (funciones puras, testeadas)
    market/           # binance.ts, stream.ts (WS singleton), synthetic.ts
  stores/             # Zustand: price-store (live), portfolio-store (persistido)
  hooks/              # use-klines, use-tickers, use-portfolio-value
```

## Del MVP al producto completo

Este MVP corre en local sin backend. El [blueprint](../output/papermoon-blueprint.md) documenta el camino a producción: **Supabase** (Auth + Postgres multi-usuario), órdenes **límite** con motor de matching por cron, **equity snapshots** en servidor, y despliegue en **Vercel**.

---

> **Aviso legal:** Simulador con fines educativos. No es asesoramiento financiero. Fondos virtuales, sin operaciones reales. El rendimiento simulado no garantiza resultados futuros.
