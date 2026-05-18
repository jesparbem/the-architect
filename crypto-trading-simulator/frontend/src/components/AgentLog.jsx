const LEVEL_STYLE = {
  TRADE: {
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.06)',
    border: 'rgba(251,191,36,0.14)',
  },
  ERROR: {
    color: '#ff4d6d',
    bg: 'rgba(255,77,109,0.06)',
    border: 'rgba(255,77,109,0.14)',
  },
  INFO: {
    color: '#94a3b8',
    bg: 'transparent',
    border: 'transparent',
  },
}

const ACTION_CONFIG = {
  BUY:         { icon: '●', color: 'var(--green)',  glow: '0 0 6px rgba(0,255,136,0.7)'   },
  SELL:        { icon: '●', color: 'var(--red)',    glow: '0 0 6px rgba(255,77,109,0.7)'  },
  FETCH:       { icon: '◈', color: 'var(--blue)',   glow: '0 0 6px rgba(56,189,248,0.7)'  },
  ANALYZE:     { icon: '◉', color: 'var(--purple)', glow: '0 0 6px rgba(167,139,250,0.7)' },
  SIGNAL:      { icon: '◎', color: 'var(--gold)',   glow: '0 0 6px rgba(251,191,36,0.7)'  },
  STATUS:      { icon: '◆', color: 'var(--blue)',   glow: '0 0 6px rgba(56,189,248,0.5)'  },
  CYCLE:       { icon: '▶', color: '#64748b',       glow: 'none'                           },
  STOP_LOSS:   { icon: '✕', color: 'var(--red)',    glow: '0 0 6px rgba(255,77,109,0.7)'  },
  TAKE_PROFIT: { icon: '✓', color: 'var(--green)',  glow: '0 0 6px rgba(0,255,136,0.7)'   },
  RESET:       { icon: '↺', color: 'var(--purple)', glow: '0 0 6px rgba(167,139,250,0.5)' },
  SKIP:        { icon: '⊘', color: '#475569',       glow: 'none'                           },
}

const DEFAULT_ACTION = { icon: '·', color: '#475569', glow: 'none' }

function LogEntry({ log }) {
  const lvl = LEVEL_STYLE[log.level] || LEVEL_STYLE.INFO
  const act = ACTION_CONFIG[log.action] || DEFAULT_ACTION
  const time = new Date(log.timestamp * 1000)
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 7,
        padding: '4px 8px',
        borderRadius: 4,
        background: lvl.bg,
        border: `1px solid ${lvl.border}`,
        marginBottom: 2,
        fontSize: 11,
        lineHeight: 1.55,
        transition: 'opacity 0.2s',
      }}
    >
      {/* Timestamp */}
      <span
        className="font-mono"
        style={{
          color: '#1e2a38',
          flexShrink: 0,
          fontSize: 10,
          letterSpacing: '0.04em',
          paddingTop: 1,
          userSelect: 'none',
          minWidth: 56,
        }}
      >
        {time}
      </span>

      {/* Action icon */}
      <span
        style={{
          color: act.color,
          textShadow: act.glow,
          flexShrink: 0,
          fontSize: 10,
          paddingTop: 1,
          width: 10,
          textAlign: 'center',
          lineHeight: 1.55,
        }}
      >
        {act.icon}
      </span>

      {/* Cycle badge */}
      {log.cycle != null && (
        <span
          style={{
            flexShrink: 0,
            fontSize: 9,
            color: '#2d3a4a',
            border: '1px solid rgba(45,58,74,0.8)',
            borderRadius: 3,
            padding: '0 3px',
            lineHeight: '16px',
            letterSpacing: '0.04em',
            userSelect: 'none',
          }}
        >
          C{log.cycle}
        </span>
      )}

      {/* Message */}
      <span style={{ color: lvl.color, wordBreak: 'break-word', flex: 1, lineHeight: 1.55 }}>
        {log.message}
      </span>
    </div>
  )
}

export default function AgentLog({ logs = [] }) {
  const reversed = [...logs].reverse()

  return (
    <div className="card" style={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '13px 16px 11px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(0,255,136,0.015)',
        flexShrink: 0,
      }}>
        <span className="live-dot" />
        <span
          className="section-label"
          style={{
            color: 'var(--green)',
            textShadow: '0 0 12px rgba(0,255,136,0.5)',
            letterSpacing: '0.1em',
          }}
        >
          Agent Log
        </span>
        <span style={{ color: 'var(--muted)', fontSize: 11, marginLeft: 'auto' }}>
          {logs.length} entries
        </span>
      </div>

      {/* Log entries — terminal scanline container */}
      <div
        className="terminal"
        style={{
          overflowY: 'auto',
          flex: 1,
          padding: '10px 12px',
        }}
      >
        {reversed.length === 0 ? (
          <div
            className="font-mono"
            style={{
              color: 'var(--muted)',
              fontSize: 11,
              textAlign: 'center',
              paddingTop: 28,
              opacity: 0.6,
            }}
          >
            <span className="live-dot" style={{ marginRight: 8 }} />
            Initializing agents…
          </div>
        ) : (
          reversed.map((log, i) => <LogEntry key={i} log={log} />)
        )}
      </div>
    </div>
  )
}
