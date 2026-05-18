const LEVEL_CONFIG = {
  'TRADE': { color: 'text-yellow-300', bg: 'bg-yellow-950/20' },
  'ERROR': { color: 'text-red-400', bg: 'bg-red-950/20' },
  'INFO': { color: 'text-gray-300', bg: '' },
}

const ACTION_ICONS = {
  'BUY': '[BUY]',
  'SELL': '[SELL]',
  'FETCH': '[FETCH]',
  'ANALYZE': '[ANALYZE]',
  'SIGNAL': '[SIGNAL]',
  'STATUS': '[STATUS]',
  'CYCLE': '[CYCLE]',
  'STOP_LOSS': '[SL]',
  'TAKE_PROFIT': '[TP]',
  'RESET': '[RESET]',
  'SKIP': '[SKIP]',
}

export default function AgentLog({ logs }) {
  const reversed = [...logs].reverse()

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 h-full">
      <h2 className="text-gray-400 text-sm uppercase tracking-wider mb-3">
        Agent Decision Log
      </h2>

      <div className="overflow-y-auto max-h-96 space-y-1 font-mono">
        {reversed.length === 0 ? (
          <div className="text-gray-700 text-xs text-center py-4">Starting up...</div>
        ) : (
          reversed.map((log, i) => {
            const config = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.INFO
            const icon = ACTION_ICONS[log.action] || '·'
            return (
              <div key={i} className={`text-xs py-1 px-2 rounded ${config.bg}`}>
                <span className="text-gray-700">
                  {new Date(log.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                {' '}
                <span className="text-gray-500">{icon}</span>
                {' '}
                <span className={config.color}>{log.message}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
