const STARTING = 50.0

function Metric({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
      <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-gray-600 text-xs mt-1">{sub}</div>}
    </div>
  )
}

export default function PortfolioCard({ portfolio }) {
  if (!portfolio) return null

  const { cash, total_value, total_pnl, total_pnl_pct, total_fees_paid, positions, trades_count } = portfolio
  const posCount = Object.keys(positions || {}).length

  const pnlColor = total_pnl >= 0 ? 'text-green-400' : 'text-red-400'
  const pnlPrefix = total_pnl >= 0 ? '+' : ''

  const progressPct = Math.min(((total_value / STARTING) * 100), 200)
  const progressColor = total_value >= STARTING ? 'bg-green-500' : 'bg-red-500'

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Metric
          label="Portfolio Value"
          value={`$${(total_value || 0).toFixed(2)}`}
          sub={`Started: $${STARTING.toFixed(2)}`}
          color="text-white"
        />
        <Metric
          label="Total P&L"
          value={`${pnlPrefix}$${(total_pnl || 0).toFixed(2)}`}
          sub={`${pnlPrefix}${(total_pnl_pct || 0).toFixed(2)}%`}
          color={pnlColor}
        />
        <Metric
          label="Available Cash"
          value={`$${(cash || 0).toFixed(2)}`}
          sub={`${((cash/total_value)*100 || 0).toFixed(0)}% liquid`}
          color="text-blue-400"
        />
        <Metric
          label="Open Positions"
          value={posCount}
          sub={`Max: 5`}
          color={posCount > 0 ? 'text-yellow-400' : 'text-gray-500'}
        />
        <Metric
          label="Total Trades"
          value={trades_count || 0}
          sub="simulated"
          color="text-purple-400"
        />
        <Metric
          label="Fees Paid"
          value={`$${(total_fees_paid || 0).toFixed(3)}`}
          sub="0.1% per trade"
          color="text-orange-400"
        />
      </div>

      {/* Progress bar */}
      <div className="mt-3 bg-gray-900 border border-gray-800 rounded-xl p-3">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>Capital Growth</span>
          <span>${STARTING} &rarr; ${(total_value || STARTING).toFixed(2)}</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${Math.min(progressPct, 100)}%` }}
          />
        </div>

        {/* Active positions */}
        {posCount > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(positions).map(([coinId, pos]) => {
              const pnlPct = pos.pnl_pct || 0
              const isUp = pnlPct >= 0
              return (
                <div
                  key={coinId}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${
                    isUp
                      ? 'bg-green-950/40 border-green-800/50 text-green-300'
                      : 'bg-red-950/40 border-red-800/50 text-red-300'
                  }`}
                >
                  <span className="font-bold">{pos.symbol}</span>
                  <span>{isUp ? '&#x25B2;' : '&#x25BC;'} {Math.abs(pnlPct).toFixed(1)}%</span>
                  <span className="text-gray-500">${(pos.current_value || 0).toFixed(2)}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
