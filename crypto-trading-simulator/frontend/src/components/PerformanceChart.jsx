import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const STARTING = 50.0

function formatTime(ts) {
  return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const pnl = d.total_value - STARTING
  const pct = ((d.total_value / STARTING) - 1) * 100
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs">
      <div className="text-gray-400">{formatTime(d.timestamp)}</div>
      <div className="text-white font-bold text-base">${d.total_value.toFixed(2)}</div>
      <div className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)} ({pct.toFixed(2)}%)
      </div>
    </div>
  )
}

export default function PerformanceChart({ history }) {
  const data = history.map(h => ({
    ...h,
    total_value: parseFloat(h.total_value.toFixed(4))
  }))

  const currentValue = data.length > 0 ? data[data.length - 1].total_value : STARTING
  const minVal = data.length > 0 ? Math.min(...data.map(d => d.total_value)) : STARTING - 1
  const maxVal = data.length > 0 ? Math.max(...data.map(d => d.total_value)) : STARTING + 1
  const padding = (maxVal - minVal) * 0.1

  const isPositive = currentValue >= STARTING

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 h-72">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-gray-400 text-sm uppercase tracking-wider">Portfolio Performance</h2>
          <div className={`text-3xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            ${currentValue.toFixed(2)}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '&#x25B2;' : '&#x25BC;'} {Math.abs(((currentValue / STARTING) - 1) * 100).toFixed(2)}%
          </div>
          <div className="text-gray-600 text-xs">from $50.00</div>
        </div>
      </div>

      {data.length < 2 ? (
        <div className="flex items-center justify-center h-32 text-gray-600 text-sm">
          Waiting for first trading cycle...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="75%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="valueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#00FF88' : '#FF4444'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isPositive ? '#00FF88' : '#FF4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="timestamp" tickFormatter={formatTime} stroke="#374151" tick={{ fontSize: 10, fill: '#6b7280' }} />
            <YAxis stroke="#374151" tick={{ fontSize: 10, fill: '#6b7280' }} domain={[minVal - padding, maxVal + padding]} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={STARTING} stroke="#4b5563" strokeDasharray="4 4" label={{ value: '$50', fill: '#6b7280', fontSize: 10 }} />
            <Area
              type="monotone"
              dataKey="total_value"
              stroke={isPositive ? '#00FF88' : '#FF4444'}
              strokeWidth={2}
              fill="url(#valueGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
