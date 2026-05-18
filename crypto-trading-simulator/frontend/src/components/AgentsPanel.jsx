const STATUS_CONFIG = {
  active:  { color: 'var(--green)',  glow: '0 0 8px rgba(0,255,136,0.8)',  label: 'ACTIVE',   pulse: true  },
  paused:  { color: 'var(--gold)',   glow: '0 0 8px rgba(251,191,36,0.8)', label: 'PAUSED',   pulse: false },
  waiting: { color: '#475569',       glow: 'none',                          label: 'WAITING',  pulse: false },
  error:   { color: 'var(--red)',    glow: '0 0 8px rgba(255,77,109,0.8)', label: 'ERROR',    pulse: false },
}

const AGENT_COLORS = {
  blue:   { top: 'var(--blue)',   glow: 'rgba(56,189,248,0.25)',   bg: 'rgba(56,189,248,0.04)'  },
  purple: { top: 'var(--purple)', glow: 'rgba(167,139,250,0.25)',  bg: 'rgba(167,139,250,0.04)' },
  green:  { top: 'var(--green)',  glow: 'rgba(0,255,136,0.25)',    bg: 'rgba(0,255,136,0.04)'   },
  yellow: { top: 'var(--gold)',   glow: 'rgba(251,191,36,0.25)',   bg: 'rgba(251,191,36,0.04)'  },
  pink:   { top: '#f472b6',       glow: 'rgba(244,114,182,0.25)',  bg: 'rgba(244,114,182,0.04)' },
}

function AgentCard({ agent }) {
  const status  = STATUS_CONFIG[agent.status] || STATUS_CONFIG.waiting
  const palette = AGENT_COLORS[agent.color]   || AGENT_COLORS.blue

  return (
    <div
      className="card"
      style={{
        padding: 0,
        borderTop: `2px solid ${palette.top}`,
        boxShadow: `0 0 20px ${palette.glow}, inset 0 0 40px ${palette.bg}`,
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Top section: icon + name + status */}
      <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          {/* Icon */}
          <div
            style={{
              width: 40, height: 40, borderRadius: 10,
              background: `linear-gradient(135deg, ${palette.bg}, rgba(10,16,32,0.8))`,
              border: `1px solid ${palette.top}33`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, flexShrink: 0,
              boxShadow: `0 0 12px ${palette.glow}`,
            }}
          >
            {agent.icon}
          </div>

          {/* Name + role */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13, letterSpacing: '0.02em' }}>
              {agent.name}
            </div>
            <div style={{ color: palette.top, fontSize: 10, letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 600 }}>
              {agent.role}
            </div>
          </div>

          {/* Status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
            <span
              className={status.pulse ? 'pulse-dot' : ''}
              style={{
                width: 7, height: 7, borderRadius: '50%',
                background: status.color,
                boxShadow: status.glow,
                display: 'inline-block',
              }}
            />
            <span
              className="section-label"
              style={{ color: status.color, fontSize: 9 }}
            >
              {status.label}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={{ padding: '10px 14px', flex: 1 }}>
        <p style={{ color: 'var(--muted)', fontSize: 11, lineHeight: 1.6, margin: 0 }}>
          {agent.description}
        </p>
      </div>

      {/* Footer: stats + interval */}
      <div style={{ padding: '8px 14px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {agent.stats && (
          <span
            className="font-mono"
            style={{
              fontSize: 10, color: palette.top,
              background: `${palette.bg}`,
              border: `1px solid ${palette.top}22`,
              borderRadius: 5, padding: '2px 7px',
              textShadow: `0 0 8px ${palette.glow}`,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140,
            }}
          >
            {agent.stats}
          </span>
        )}
        {agent.interval_s && (
          <span className="section-label" style={{ color: 'var(--muted)', marginLeft: 'auto' }}>
            {agent.interval_s}s
          </span>
        )}
      </div>
    </div>
  )
}

export default function AgentsPanel({ agents = [] }) {
  const activeCount = agents.filter(a => a.status === 'active').length

  return (
    <div className="card" style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 12px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: 16 }}>🧠</span>
        <span className="section-label" style={{ color: 'var(--purple)', textShadow: '0 0 10px rgba(167,139,250,0.5)' }}>
          System Agents
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 11, fontWeight: 700,
              color: activeCount > 0 ? 'var(--green)' : 'var(--muted)',
              background: activeCount > 0 ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${activeCount > 0 ? 'rgba(0,255,136,0.25)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 20, padding: '1px 8px',
              textShadow: activeCount > 0 ? '0 0 8px rgba(0,255,136,0.5)' : 'none',
            }}
          >
            {activeCount} active
          </span>
          <span style={{ color: 'var(--muted)', fontSize: 11 }}>/ {agents.length}</span>
        </div>
      </div>

      {/* Grid */}
      <div
        style={{ padding: 14 }}
        className="agents-grid"
      >
        <style>{`
          .agents-grid > .agent-grid-inner {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 12px;
          }
          @media (min-width: 1280px) {
            .agents-grid > .agent-grid-inner {
              grid-template-columns: repeat(5, 1fr);
            }
          }
        `}</style>
        <div className="agent-grid-inner">
          {agents.map(a => <AgentCard key={a.id} agent={a} />)}
          {agents.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px 16px', color: 'var(--muted)', fontSize: 12 }}>
              <span className="live-dot" style={{ marginRight: 6 }} />
              Loading agents…
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
