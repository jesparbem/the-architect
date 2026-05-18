import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const STARTING = 50.0

function fmt(ts) {
  return new Date(ts * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d   = payload[0].payload
  const pnl = d.total_value - STARTING
  const pct = ((d.total_value / STARTING) - 1) * 100
  const isUp = pnl >= 0
  return (
    <div className="card glass px-4 py-3 text-xs"
         style={{ minWidth: '150px', boxShadow: isUp ? '0 4px 20px rgba(0,255,136,0.18)' : '0 4px 20px rgba(255,77,109,0.18)' }}>
      <div className="font-mono text-xl font-bold mb-1" style={{ color: isUp ? '#00ff88' : '#ff4d6d' }}>
        ${d.total_value.toFixed(2)}
      </div>
      <div className="font-mono" style={{ color: isUp ? '#00ff88' : '#ff4d6d' }}>
        {isUp ? '+' : ''}${pnl.toFixed(2)} · {isUp ? '+' : ''}{pct.toFixed(2)}%
      </div>
      <div style={{ color: 'var(--muted)', marginTop: '4px' }}>{fmt(d.timestamp)}</div>
    </div>
  )
}

export default function PerformanceChart({ history }) {
  const data  = history.map(h => ({ ...h, total_value: +h.total_value.toFixed(4) }))
  const cur   = data.length ? data[data.length - 1].total_value : STARTING
  const isPos = cur >= STARTING
  const pnl   = cur - STARTING
  const pct   = ((cur / STARTING) - 1) * 100
  const color = isPos ? '#00ff88' : '#ff4d6d'
  const minV  = data.length ? Math.min(...data.map(d => d.total_value)) : STARTING - 1
  const maxV  = data.length ? Math.max(...data.map(d => d.total_value)) : STARTING + 1
  const pad   = Math.max((maxV - minV) * 0.15, 0.5)

  return (
    <div className="card p-5" style={{ height: '300px' }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <span className="section-label">Portfolio Performance</span>
          <div className="font-mono text-3xl font-black mt-1 leading-none"
               style={{ color, textShadow: isPos ? '0 0 24px rgba(0,255,136,0.4)' : '0 0 24px rgba(255,77,109,0.4)' }}>
            ${cur.toFixed(2)}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-base font-bold" style={{ color }}>
            {isPos ? '▲' : '▼'} {Math.abs(pct).toFixed(2)}%
          </div>
          <div className="font-mono text-sm" style={{ color }}>
            {isPos ? '+' : ''}${pnl.toFixed(2)}
          </div>
          <div className="section-label mt-1">from $50.00</div>
        </div>
      </div>

      {data.length < 2 ? (
        <div className="flex items-center justify-center h-36 gap-2.5">
          <div className="live-dot" />
          <span className="text-sm" style={{ color: 'var(--muted)' }}>
            Waiting for first trading cycle…
          </span>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="72%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.28} />
                <stop offset="75%" stopColor={color} stopOpacity={0.03} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 6" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="timestamp" tickFormatter={fmt} stroke="transparent"
                   tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono' }} />
            <YAxis stroke="transparent"
                   tick={{ fontSize: 10, fill: '#475569', fontFamily: 'JetBrains Mono' }}
                   domain={[minV - pad, maxV + pad]}
                   tickFormatter={v => `$${v.toFixed(1)}`} />
            <Tooltip content={<CustomTooltip />}
                     cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.5 }} />
            <ReferenceLine y={STARTING} stroke="rgba(255,255,255,0.1)" strokeDasharray="6 4"
                           label={{ value: '$50', fill: '#475569', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
            <Area type="monotone" dataKey="total_value"
                  stroke={color} strokeWidth={2.5}
                  fill="url(#perfGrad)" dot={false}
                  activeDot={{ r: 5, fill: color, strokeWidth: 0, filter: `drop-shadow(0 0 6px ${color})` }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
