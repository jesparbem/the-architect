function SignalBadge({ signal }) {
  const config = {
    'STRONG_BUY': { color: 'bg-green-500/20 text-green-300 border-green-700', label: 'STRONG BUY' },
    'BUY':        { color: 'bg-green-900/30 text-green-400 border-green-800', label: 'BUY' },
    'HOLD':       { color: 'bg-gray-800/30 text-gray-400 border-gray-700',    label: 'HOLD' },
    'SELL':       { color: 'bg-red-900/30 text-red-400 border-red-800',       label: 'SELL' },
    'STRONG_SELL':{ color: 'bg-red-500/20 text-red-300 border-red-700',       label: 'STRONG SELL' },
  }
  const { color, label } = config[signal] || config['HOLD']
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-bold ${color}`}>
      {label}
    </span>
  )
}

function MomentumCell({ value }) {
  const isPos = value >= 0
  return (
    <span className={`text-xs font-mono ${isPos ? 'text-green-400' : 'text-red-400'}`}>
      {isPos ? '+' : ''}{value?.toFixed(2)}%
    </span>
  )
}

export default function PriceTable({ signals, positions }) {
  const buySignals = signals.filter(s => ['STRONG_BUY', 'BUY'].includes(s.signal))
  const otherSignals = signals.filter(s => !['STRONG_BUY', 'BUY'].includes(s.signal))
  const displaySignals = [...buySignals.slice(0, 5), ...otherSignals.slice(0, 10)].slice(0, 15)

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
      <h2 className="text-gray-400 text-sm uppercase tracking-wider mb-3">
        Market Signals ({signals.length} coins analyzed)
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-600 border-b border-gray-800">
              <th className="text-left py-2 pr-3">Coin</th>
              <th className="text-left py-2 pr-3">Price</th>
              <th className="text-left py-2 pr-3">Signal</th>
              <th className="text-right py-2 pr-3">1h</th>
              <th className="text-right py-2 pr-3">24h</th>
              <th className="text-right py-2 pr-3">7d</th>
              <th className="text-right py-2 pr-3">RSI</th>
              <th className="text-left py-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {displaySignals.map((s) => {
              const hasPosition = positions[s.coin_id]
              return (
                <tr key={s.coin_id} className={`border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors ${hasPosition ? 'bg-yellow-950/20' : ''}`}>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2">
                      {hasPosition && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 pulse-dot" />}
                      <div>
                        <div className="font-bold text-white">{s.symbol}</div>
                        <div className="text-gray-600 truncate max-w-[80px]">{s.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2 pr-3 font-mono text-white">
                    ${s.current_price < 0.01
                      ? s.current_price?.toFixed(6)
                      : s.current_price < 1
                        ? s.current_price?.toFixed(4)
                        : s.current_price?.toFixed(2)
                    }
                  </td>
                  <td className="py-2 pr-3">
                    <SignalBadge signal={s.signal} />
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <MomentumCell value={s.momentum_1h} />
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <MomentumCell value={s.momentum_24h} />
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <MomentumCell value={s.momentum_7d} />
                  </td>
                  <td className="py-2 pr-3 text-right">
                    {s.rsi ? (
                      <span className={`font-mono ${s.rsi < 30 ? 'text-green-400' : s.rsi > 70 ? 'text-red-400' : 'text-gray-400'}`}>
                        {s.rsi.toFixed(0)}
                      </span>
                    ) : <span className="text-gray-700">-</span>}
                  </td>
                  <td className="py-2 text-gray-500 max-w-[200px] truncate">
                    {s.reasons?.[0] || '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
