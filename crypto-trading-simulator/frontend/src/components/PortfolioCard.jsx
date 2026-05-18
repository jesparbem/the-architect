const STARTING = 50.0

function MetricTile({ label, value, sub, accent = '#e2e8f0', icon }) {
  return (
    <div className="card p-4 flex flex-col gap-1 group">
      <div className="flex items-center justify-between mb-0.5">
        <span className="section-label">{label}</span>
        {icon && <span className="text-base opacity-40 group-hover:opacity-70 transition-opacity">{icon}</span>}
      </div>
      <div className="font-mono text-2xl font-bold leading-none" style={{ color: accent }}>
        {value}
      </div>
      {sub && <div className="font-mono text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{sub}</div>}
    </div>
  )
}

function PositionBadge({ pos }) {
  const pnlPct = pos.pnl_pct || 0
  const isUp = pnlPct >= 0
  const color = isUp ? '#00ff88' : '#ff4d6d'
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all"
         style={{
           background: isUp ? 'rgba(0,255,136,0.07)' : 'rgba(255,77,109,0.07)',
           border: `1px solid ${isUp ? 'rgba(0,255,136,0.2)' : 'rgba(255,77,109,0.2)'}`,
         }}>
      <div>
        <div className="font-bold text-xs text-white">{pos.symbol}</div>
        <div className="font-mono text-xs" style={{ color }}>
          {isUp ? '▲' : '▼'} {Math.abs(pnlPct).toFixed(2)}%
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-xs text-white">${(pos.current_value || 0).toFixed(2)}</div>
        <div className="font-mono text-xs" style={{ color }}>
          {isUp ? '+' : ''}${(pos.pnl || 0).toFixed(2)}
        </div>
      </div>
    </div>
  )
}

export default function PortfolioCard({ portfolio }) {
  if (!portfolio) return null
  const { cash, total_value, total_pnl, total_pnl_pct, total_fees_paid, positions, trades_count } = portfolio
  const posCount = Object.keys(positions || {}).length
  const isPos = (total_pnl || 0) >= 0
  const pnlColor = isPos ? '#00ff88' : '#ff4d6d'
  const growthPct = Math.min(((total_value || STARTING) / STARTING) * 100, 200)

  return (
    <div>
      {/* ── 6 metric tiles ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricTile
          label="Portfolio Value" icon="💰"
          value={`$${(total_value || 0).toFixed(2)}`}
          sub={`Started $${STARTING.toFixed(2)}`}
          accent="#e2e8f0"
        />
        <MetricTile
          label="Total P&L" icon={isPos ? '📈' : '📉'}
          value={`${isPos ? '+' : ''}$${(total_pnl || 0).toFixed(2)}`}
          sub={`${isPos ? '+' : ''}${(total_pnl_pct || 0).toFixed(2)}%`}
          accent={pnlColor}
        />
        <MetricTile
          label="Available Cash" icon="💵"
          value={`$${(cash || 0).toFixed(2)}`}
          sub={`${((cash / (total_value || 1)) * 100).toFixed(0)}% liquid`}
          accent="#38bdf8"
        />
        <MetricTile
          label="Open Positions" icon="📊"
          value={posCount}
          sub={`Max ${portfolio.positions ? Object.keys(portfolio.positions).length : 0} / 5`}
          accent={posCount > 0 ? '#fbbf24' : 'var(--muted)'}
        />
        <MetricTile
          label="Total Trades" icon="⚡"
          value={trades_count || 0}
          sub="simulated"
          accent="#a78bfa"
        />
        <MetricTile
          label="Fees Paid" icon="💸"
          value={`$${(total_fees_paid || 0).toFixed(3)}`}
          sub="0.1% per trade"
          accent="#f97316"
        />
      </div>

      {/* ── Growth bar + positions ─── */}
      <div className="card mt-3 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="section-label">Capital Growth</span>
          <span className="font-mono text-xs" style={{ color: pnlColor }}>
            $50.00 → ${(total_value || STARTING).toFixed(2)} ({isPos ? '+' : ''}{(total_pnl_pct || 0).toFixed(2)}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-1.5 rounded-full overflow-hidden"
             style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full progress-bar-fill"
               style={{
                 width: `${Math.min(growthPct, 100)}%`,
                 background: isPos
                   ? 'linear-gradient(90deg, #00b86b, #00ff88)'
                   : 'linear-gradient(90deg, #cc1f36, #ff4d6d)',
                 boxShadow: isPos ? '0 0 8px rgba(0,255,136,0.4)' : '0 0 8px rgba(255,77,109,0.4)'
               }} />
        </div>

        {/* Open positions */}
        {posCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="section-label self-center mr-1">Positions:</span>
            {Object.values(positions).map((pos, i) => (
              <PositionBadge key={i} pos={pos} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
