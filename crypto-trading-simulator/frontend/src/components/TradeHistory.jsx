function borderColor(trade) {
  if (trade.action === 'BUY')           return 'var(--green)'
  if (trade.strategy === 'STOP_LOSS')   return 'var(--red)'
  if (trade.strategy === 'TAKE_PROFIT') return '#38bdf8'
  return 'var(--red)'
}

function tradeIcon(trade) {
  if (trade.action === 'BUY')           return '🟢'
  if (trade.strategy === 'STOP_LOSS')   return '🛑'
  if (trade.strategy === 'TAKE_PROFIT') return '✅'
  return '🔴'
}

function ActionBadge({ trade }) {
  const isBuy  = trade.action === 'BUY'
  const isSL   = trade.strategy === 'STOP_LOSS'
  const isTP   = trade.strategy === 'TAKE_PROFIT'

  const label  = isBuy ? 'BUY' : isSL ? 'STOP LOSS' : isTP ? 'TAKE PROFIT' : 'SELL'
  const color  = isBuy ? 'var(--green)' : isSL ? 'var(--red)' : isTP ? 'var(--blue)' : 'var(--red)'
  const border = isBuy
    ? 'rgba(0,255,136,0.3)'
    : isSL
      ? 'rgba(255,77,109,0.3)'
      : isTP
        ? 'rgba(56,189,248,0.3)'
        : 'rgba(255,77,109,0.3)'
  const bg     = isBuy
    ? 'rgba(0,255,136,0.07)'
    : isSL
      ? 'rgba(255,77,109,0.07)'
      : isTP
        ? 'rgba(56,189,248,0.07)'
        : 'rgba(255,77,109,0.07)'

  return (
    <span style={{
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: '0.08em',
      color,
      border: `1px solid ${border}`,
      background: bg,
      borderRadius: 4,
      padding: '1px 5px',
      fontFamily: 'Inter, sans-serif',
    }}>
      {label}
    </span>
  )
}

function TradeRow({ trade }) {
  const pnl      = trade.pnl || 0
  const pnlPos   = pnl >= 0
  const isBuy    = trade.action === 'BUY'
  const leftCol  = borderColor(trade)
  const time     = new Date(trade.timestamp * 1000)
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '9px 14px 9px 0',
        paddingLeft: 12,
        borderBottom: '1px solid rgba(56,189,248,0.04)',
        borderLeft: `2px solid ${leftCol}`,
        transition: 'background 0.15s',
        cursor: 'default',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(56,189,248,0.04)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      {/* Left: icon + info */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, minWidth: 0, flex: 1 }}>
        <span style={{ fontSize: 13, lineHeight: 1.5, flexShrink: 0 }}>{tradeIcon(trade)}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
            <span style={{
              fontWeight: 700,
              color: 'var(--text)',
              fontSize: 13,
              letterSpacing: '0.03em',
            }}>
              {trade.symbol}
            </span>
            <ActionBadge trade={trade} />
            <span
              className="font-mono"
              style={{ color: 'rgba(71,85,105,0.7)', fontSize: 10 }}
            >
              #{trade.id}
            </span>
          </div>
          <div style={{
            color: 'var(--muted)',
            fontSize: 11,
            maxWidth: 260,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.4,
          }}>
            {trade.reason || trade.strategy || '—'}
          </div>
        </div>
      </div>

      {/* Right: value + pnl + time */}
      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
        <div
          className="font-mono"
          style={{ color: 'var(--text)', fontSize: 13, fontWeight: 600, letterSpacing: '0.02em' }}
        >
          ${(trade.total_value || 0).toFixed(2)}
        </div>
        {!isBuy && pnl !== 0 && (
          <div
            className="font-mono"
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: pnlPos ? 'var(--green)' : 'var(--red)',
              textShadow: pnlPos
                ? '0 0 8px rgba(0,255,136,0.5)'
                : '0 0 8px rgba(255,77,109,0.5)',
            }}
          >
            {pnlPos ? '+' : ''}${pnl.toFixed(2)}
          </div>
        )}
        <div style={{ color: 'var(--muted)', fontSize: 10, marginTop: 2 }}>{time}</div>
      </div>
    </div>
  )
}

export default function TradeHistory({ trades = [] }) {
  const reversed = [...trades].reverse()
  const sells    = trades.filter(t => t.action === 'SELL')
  const wins     = sells.filter(t => (t.pnl || 0) > 0).length
  const losses   = sells.filter(t => (t.pnl || 0) < 0).length
  const totalPnl = sells.reduce((sum, t) => sum + (t.pnl || 0), 0)
  const winRate  = sells.length > 0 ? (wins / sells.length) * 100 : 0

  return (
    <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        padding: '13px 16px 11px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(56,189,248,0.02)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: sells.length > 0 ? 10 : 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="live-dot" />
            <span
              className="section-label"
              style={{ color: 'var(--blue)', textShadow: '0 0 12px rgba(56,189,248,0.5)' }}
            >
              Trade History
            </span>
          </div>

          {trades.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11 }}>
              {/* W/L */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--green)', fontWeight: 700 }}>W{wins}</span>
                <span style={{ color: 'rgba(71,85,105,0.5)' }}>/</span>
                <span style={{ color: 'var(--red)', fontWeight: 700 }}>L{losses}</span>
              </div>
              {/* Total PnL */}
              <span
                className="font-mono"
                style={{
                  fontWeight: 700,
                  fontSize: 12,
                  color: totalPnl >= 0 ? 'var(--green)' : 'var(--red)',
                  textShadow: totalPnl >= 0
                    ? '0 0 8px rgba(0,255,136,0.5)'
                    : '0 0 8px rgba(255,77,109,0.5)',
                }}
              >
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Win-rate bar */}
        {sells.length > 0 && (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 10,
              color: 'var(--muted)',
              marginBottom: 5,
            }}>
              <span style={{ letterSpacing: '0.05em' }}>WIN RATE</span>
              <span
                className="font-mono"
                style={{
                  color: winRate >= 50 ? 'var(--green)' : 'var(--red)',
                  fontWeight: 600,
                }}
              >
                {winRate.toFixed(1)}%
              </span>
            </div>
            <div style={{
              height: 3,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${winRate}%`,
                height: '100%',
                background: winRate >= 50 ? 'var(--green)' : 'var(--red)',
                boxShadow: winRate >= 50
                  ? '0 0 6px rgba(0,255,136,0.5)'
                  : '0 0 6px rgba(255,77,109,0.5)',
                transition: 'width 0.6s ease',
                borderRadius: 2,
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Trade list */}
      <div style={{ overflowY: 'auto', maxHeight: 360, flex: 1 }}>
        {reversed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span className="live-dot" />
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>Waiting for first trade…</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', opacity: 0.4 }}>
              The bot will execute trades based on market signals
            </div>
          </div>
        ) : (
          reversed.map(trade => <TradeRow key={trade.id} trade={trade} />)
        )}
      </div>
    </div>
  )
}
