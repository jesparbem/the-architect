import PortfolioCard from './PortfolioCard.jsx'
import PriceTable from './PriceTable.jsx'
import TradeHistory from './TradeHistory.jsx'
import AgentLog from './AgentLog.jsx'
import PerformanceChart from './PerformanceChart.jsx'
import ChatPanel from './ChatPanel.jsx'
import AgentsPanel from './AgentsPanel.jsx'

function LiveBadge({ connected }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
         style={{ background: connected ? 'rgba(0,255,136,0.08)' : 'rgba(255,77,109,0.08)',
                  border: `1px solid ${connected ? 'rgba(0,255,136,0.25)' : 'rgba(255,77,109,0.25)'}` }}>
      <span className={connected ? 'live-dot' : 'pulse-dot w-2 h-2 rounded-full bg-red-500'} />
      <span className="text-xs font-semibold tracking-widest"
            style={{ color: connected ? '#00ff88' : '#ff4d6d' }}>
        {connected ? 'LIVE' : 'OFFLINE'}
      </span>
    </div>
  )
}

export default function Dashboard({ state, connected, lastUpdate, onReset }) {
  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center animate-fade-in">
          <div className="text-7xl mb-6" style={{ filter: 'drop-shadow(0 0 30px rgba(56,189,248,0.4))' }}>🤖</div>
          <div className="text-xl font-semibold mb-2" style={{ color: '#38bdf8' }}>
            Initializing Trading Engine
          </div>
          <div className="flex justify-center gap-1 mt-4">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-blue-400"
                   style={{ animation: `simplePulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const { portfolio, signals, agent_log, cycle_count, day_count, agents = [], trading_config, is_paused } = state
  const pnl = portfolio?.total_pnl || 0
  const pnlPct = portfolio?.total_pnl_pct || 0
  const isPos = pnl >= 0
  const modeColors = { conservative: '#38bdf8', balanced: '#fbbf24', aggressive: '#ff4d6d' }
  const mode = trading_config?.mode || 'balanced'

  return (
    <div style={{ maxWidth: '1900px', margin: '0 auto', padding: '1rem 1.25rem' }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between mb-5 pb-4"
              style={{ borderBottom: '1px solid rgba(56,189,248,0.1)' }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" style={{ filter: 'drop-shadow(0 0 12px rgba(56,189,248,0.5))' }}>🤖</span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">Crypto AI Trader</h1>
              <p className="section-label">Day {day_count} · Cycle #{cycle_count} · CoinGecko Live</p>
            </div>
          </div>
          <div className="h-8 w-px" style={{ background: 'var(--border)' }} />
          {/* Inline PnL in header */}
          <div>
            <div className={`text-xl font-bold font-mono ${isPos ? 'text-gradient-green' : 'text-gradient-red'}`}>
              ${(portfolio?.total_value || 50).toFixed(2)}
            </div>
            <div className={`text-xs font-mono ${isPos ? 'text-green-400' : 'text-red-400'}`}>
              {isPos ? '▲' : '▼'} {Math.abs(pnlPct).toFixed(2)}% from $50
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode badge */}
          <div className="px-3 py-1 rounded-full text-xs font-bold tracking-widest"
               style={{ background: `${modeColors[mode]}15`, color: modeColors[mode],
                        border: `1px solid ${modeColors[mode]}30` }}>
            {mode.toUpperCase()}
          </div>
          {is_paused && (
            <div className="px-3 py-1 rounded-full text-xs font-bold tracking-widest"
                 style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24',
                          border: '1px solid rgba(251,191,36,0.3)' }}>
              PAUSED
            </div>
          )}
          <div className="px-3 py-1 rounded-full text-xs font-bold tracking-widest"
               style={{ background: 'rgba(56,189,248,0.08)', color: '#38bdf8',
                        border: '1px solid rgba(56,189,248,0.2)' }}>
            PAPER TRADING
          </div>
          <LiveBadge connected={connected} />
          {lastUpdate && (
            <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button onClick={onReset}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                           color: 'var(--muted)' }}
                  onMouseOver={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.15)'}
                  onMouseOut={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'}>
            Reset $50
          </button>
        </div>
      </header>

      {/* ── Portfolio metrics strip ─────────────────────────── */}
      <PortfolioCard portfolio={portfolio} />

      {/* ── Main grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-4 mt-4">

        <div className="col-span-12 lg:col-span-8">
          <PerformanceChart history={portfolio?.portfolio_history || []} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <AgentLog logs={agent_log || []} />
        </div>

        <div className="col-span-12 lg:col-span-7">
          <PriceTable signals={signals || []} positions={portfolio?.positions || {}} />
        </div>
        <div className="col-span-12 lg:col-span-5">
          <TradeHistory trades={portfolio?.trades || []} />
        </div>

        <div className="col-span-12">
          <AgentsPanel agents={agents} />
        </div>

        <div className="col-span-12">
          <ChatPanel state={state} />
        </div>

      </div>
    </div>
  )
}
