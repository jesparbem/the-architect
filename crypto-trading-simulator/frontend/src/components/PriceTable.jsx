function SignalBadge({ signal }) {
  const config = {
    STRONG_BUY:  { cls: 'badge-strong-buy',  label: '▲▲ STRONG BUY'  },
    BUY:         { cls: 'badge-buy',          label: '▲ BUY'          },
    HOLD:        { cls: 'badge-hold',         label: '— HOLD'         },
    SELL:        { cls: 'badge-sell',         label: '▼ SELL'         },
    STRONG_SELL: { cls: 'badge-strong-sell',  label: '▼▼ STRONG SELL' },
  }
  const { cls, label } = config[signal] || config.HOLD
  return <span className={cls}>{label}</span>
}

function MomentumCell({ value }) {
  if (value == null) return <span style={{ color: 'var(--muted)', fontFamily: 'monospace' }}>—</span>
  const isPos = value >= 0
  return (
    <span
      className="font-mono"
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: isPos ? 'var(--green)' : 'var(--red)',
        textShadow: isPos ? '0 0 8px rgba(0,255,136,0.45)' : '0 0 8px rgba(255,77,109,0.45)',
      }}
    >
      {isPos ? '+' : ''}{value.toFixed(2)}%
    </span>
  )
}

function RsiBar({ rsi }) {
  if (!rsi && rsi !== 0) return <span style={{ color: 'var(--muted)' }}>—</span>
  const isOversold   = rsi < 30
  const isOverbought = rsi > 70
  const color = isOversold ? 'var(--green)' : isOverbought ? 'var(--red)' : 'var(--muted)'
  const glow  = isOversold
    ? '0 0 6px rgba(0,255,136,0.7)'
    : isOverbought
      ? '0 0 6px rgba(255,77,109,0.7)'
      : 'none'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 32, height: 4,
        background: 'rgba(255,255,255,0.07)',
        borderRadius: 3, overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{
          width: `${Math.min(rsi, 100)}%`, height: '100%',
          background: color,
          boxShadow: glow,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span className="font-mono" style={{ fontSize: 11, color, textShadow: glow, minWidth: 22, textAlign: 'right' }}>
        {rsi.toFixed(0)}
      </span>
    </div>
  )
}

function StrengthBar({ strength, signal }) {
  const isPositive = ['STRONG_BUY', 'BUY'].includes(signal)
  const isNegative = ['STRONG_SELL', 'SELL'].includes(signal)
  const color = isPositive ? 'var(--green)' : isNegative ? 'var(--red)' : 'var(--muted)'
  const glow  = isPositive
    ? '0 0 6px rgba(0,255,136,0.5)'
    : isNegative
      ? '0 0 6px rgba(255,77,109,0.5)'
      : 'none'
  const pct = Math.min(Math.max((strength || 0) * 100, 0), 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 44, height: 3,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 2, overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: color,
          boxShadow: glow,
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span className="font-mono" style={{ fontSize: 10, color: 'var(--muted)', minWidth: 20 }}>
        {pct.toFixed(0)}
      </span>
    </div>
  )
}

const COL_HEAD = {
  color: 'var(--muted)',
  fontSize: 10,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  padding: '8px 10px 8px 0',
  fontWeight: 700,
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
  fontFamily: 'Inter, sans-serif',
}

const COL_CELL = {
  padding: '8px 10px 8px 0',
  borderBottom: '1px solid rgba(56,189,248,0.04)',
  verticalAlign: 'middle',
}

export default function PriceTable({ signals = [], positions = {} }) {
  const buySignals   = signals.filter(s => ['STRONG_BUY', 'BUY'].includes(s.signal))
  const otherSignals = signals.filter(s => !['STRONG_BUY', 'BUY'].includes(s.signal))
  const display      = [...buySignals.slice(0, 8), ...otherSignals].slice(0, 16)

  const formatPrice = (p) => {
    if (p == null) return '—'
    if (p < 0.001)  return `$${p.toFixed(8)}`
    if (p < 0.01)   return `$${p.toFixed(6)}`
    if (p < 1)      return `$${p.toFixed(4)}`
    if (p < 1000)   return `$${p.toFixed(2)}`
    return `$${p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const strongBuyCount = signals.filter(s => s.signal === 'STRONG_BUY').length
  const buyCount       = signals.filter(s => s.signal === 'BUY').length

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '13px 16px 11px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(56,189,248,0.02)',
      }}>
        <span className="live-dot" />
        <span
          className="section-label"
          style={{ color: 'var(--blue)', textShadow: '0 0 12px rgba(56,189,248,0.5)', letterSpacing: '0.1em' }}
        >
          Market Signals
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 11 }}>
          <span style={{ color: 'var(--muted)' }}>{signals.length} coins</span>
          <span style={{ color: 'rgba(56,189,248,0.2)' }}>|</span>
          {strongBuyCount > 0 && (
            <span style={{ color: 'var(--green)', fontWeight: 700, textShadow: '0 0 8px rgba(0,255,136,0.4)' }}>
              ▲▲ {strongBuyCount}
            </span>
          )}
          {buyCount > 0 && (
            <span style={{ color: 'var(--blue)', fontWeight: 700 }}>
              ▲ {buyCount}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'rgba(6,11,24,0.4)' }}>
              <th style={{ ...COL_HEAD, paddingLeft: 16 }}>Coin</th>
              <th style={{ ...COL_HEAD, textAlign: 'right' }}>Price</th>
              <th style={COL_HEAD}>Signal</th>
              <th style={COL_HEAD}>Strength</th>
              <th style={{ ...COL_HEAD, textAlign: 'right' }}>1h</th>
              <th style={{ ...COL_HEAD, textAlign: 'right' }}>24h</th>
              <th style={{ ...COL_HEAD, textAlign: 'right' }}>7d</th>
              <th style={COL_HEAD}>RSI</th>
              <th style={{ ...COL_HEAD, paddingRight: 16 }}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {display.map((s) => {
              const hasPosition = !!positions[s.coin_id]
              const isStrongBuy = s.signal === 'STRONG_BUY'
              const baseBg = hasPosition
                ? 'rgba(251,191,36,0.04)'
                : isStrongBuy
                  ? 'rgba(0,255,136,0.025)'
                  : 'transparent'

              return (
                <tr
                  key={s.coin_id}
                  style={{ background: baseBg, cursor: 'default', transition: 'background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.05)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = baseBg }}
                >
                  {/* Coin */}
                  <td style={{ ...COL_CELL, paddingLeft: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {hasPosition && (
                        <span
                          className="pulse-dot"
                          style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: 'var(--gold)',
                            boxShadow: '0 0 8px var(--gold)',
                            flexShrink: 0,
                            display: 'inline-block',
                          }}
                        />
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontWeight: 700,
                          color: 'var(--text)',
                          fontSize: 12,
                          letterSpacing: '0.04em',
                          lineHeight: 1.2,
                        }}>
                          {s.symbol}
                        </div>
                        <div style={{
                          color: 'var(--muted)',
                          fontSize: 10,
                          maxWidth: 70,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.3,
                        }}>
                          {s.name}
                        </div>
                      </div>
                      {s.volume_spike && (
                        <span style={{
                          fontSize: 8,
                          fontWeight: 700,
                          color: 'var(--gold)',
                          border: '1px solid rgba(251,191,36,0.35)',
                          background: 'rgba(251,191,36,0.08)',
                          borderRadius: 3,
                          padding: '1px 4px',
                          letterSpacing: '0.06em',
                          textShadow: '0 0 6px rgba(251,191,36,0.5)',
                          flexShrink: 0,
                        }}>
                          VOL
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Price */}
                  <td style={{ ...COL_CELL, textAlign: 'right' }}>
                    <span
                      className="font-mono"
                      style={{ color: 'var(--text)', fontSize: 12, fontWeight: 600, letterSpacing: '0.02em' }}
                    >
                      {formatPrice(s.current_price)}
                    </span>
                  </td>

                  {/* Signal */}
                  <td style={COL_CELL}>
                    <SignalBadge signal={s.signal} />
                  </td>

                  {/* Strength */}
                  <td style={COL_CELL}>
                    <StrengthBar strength={s.strength} signal={s.signal} />
                  </td>

                  {/* 1h */}
                  <td style={{ ...COL_CELL, textAlign: 'right' }}>
                    <MomentumCell value={s.momentum_1h} />
                  </td>

                  {/* 24h */}
                  <td style={{ ...COL_CELL, textAlign: 'right' }}>
                    <MomentumCell value={s.momentum_24h} />
                  </td>

                  {/* 7d */}
                  <td style={{ ...COL_CELL, textAlign: 'right' }}>
                    <MomentumCell value={s.momentum_7d} />
                  </td>

                  {/* RSI */}
                  <td style={COL_CELL}>
                    <RsiBar rsi={s.rsi} />
                  </td>

                  {/* Reason */}
                  <td style={{
                    ...COL_CELL,
                    paddingRight: 16,
                    maxWidth: 180,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--muted)',
                    fontSize: 11,
                  }}>
                    {s.reasons?.[0] || '—'}
                  </td>
                </tr>
              )
            })}

            {display.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  style={{
                    textAlign: 'center',
                    padding: '40px 16px',
                    color: 'var(--muted)',
                    fontSize: 12,
                  }}
                >
                  <span className="live-dot" style={{ marginRight: 8 }} />
                  Fetching market data…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
