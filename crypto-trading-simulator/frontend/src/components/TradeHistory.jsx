function TradeRow({ trade }) {
  const isBuy = trade.action === 'BUY'
  const isStopLoss = trade.strategy === 'STOP_LOSS'
  const isTakeProfit = trade.strategy === 'TAKE_PROFIT'

  const pnl = trade.pnl || 0
  const pnlColor = pnl >= 0 ? 'text-green-400' : 'text-red-400'

  return (
    <div className={`border-b border-gray-800/50 py-2 px-3 hover:bg-gray-800/20 transition-colors ${
      isBuy ? 'border-l-2 border-l-green-700' : isStopLoss ? 'border-l-2 border-l-red-700' : 'border-l-2 border-l-blue-700'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {isBuy ? '[BUY]' : isStopLoss ? '[SL]' : isTakeProfit ? '[TP]' : '[SELL]'}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{trade.symbol}</span>
              <span className={`text-xs font-bold ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
                {trade.action}
              </span>
              <span className="text-gray-600 text-xs font-mono">#{trade.id}</span>
            </div>
            <div className="text-gray-500 text-xs mt-0.5 max-w-[250px] truncate">
              {trade.reason}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <div className="text-white text-sm font-mono">${(trade.total_value || 0).toFixed(2)}</div>
          {!isBuy && pnl !== 0 && (
            <div className={`text-xs font-mono ${pnlColor}`}>
              {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
            </div>
          )}
          <div className="text-gray-700 text-xs">
            {new Date(trade.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TradeHistory({ trades }) {
  const reversed = [...trades].reverse()

  const totalPnl = trades.filter(t => t.action === 'SELL').reduce((sum, t) => sum + (t.pnl || 0), 0)
  const wins = trades.filter(t => t.action === 'SELL' && t.pnl > 0).length
  const losses = trades.filter(t => t.action === 'SELL' && t.pnl < 0).length

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-gray-400 text-sm uppercase tracking-wider">
          Trade History
        </h2>
        {trades.length > 0 && (
          <div className="flex gap-3 text-xs">
            <span className="text-green-400">W:{wins}</span>
            <span className="text-red-400">L:{losses}</span>
            <span className={`font-mono ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="overflow-y-auto max-h-80 space-y-0">
        {reversed.length === 0 ? (
          <div className="text-center text-gray-700 py-8">
            <div className="text-3xl mb-2">&#x23F3;</div>
            <div>Waiting for first trade...</div>
          </div>
        ) : (
          reversed.map((trade) => (
            <TradeRow key={trade.id} trade={trade} />
          ))
        )}
      </div>
    </div>
  )
}
