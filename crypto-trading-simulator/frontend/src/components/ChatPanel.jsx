import { useState, useRef, useEffect } from 'react'

const QUICK_ACTIONS = [
  { label: '¿Qué comprar ahora?',     icon: '🎯' },
  { label: 'Analiza mi portfolio',    icon: '📊' },
  { label: '¿Potencial +300%?',       icon: '🚀' },
  { label: 'Sé más agresivo',         icon: '🔥' },
  { label: 'Modo conservador',        icon: '🛡️' },
  { label: 'Pausa el bot',            icon: '⏸️' },
]

const TOOL_ICONS = {
  get_portfolio_state:    '💼',
  get_market_signals:     '📊',
  adjust_trading_params:  '⚙️',
  force_sell:             '🔴',
  pause_trading:          '⏸️',
  web_search:             '🔍',
}

const MODE_STYLE = {
  conservative: { color: 'var(--blue)',   border: 'rgba(56,189,248,0.35)',   bg: 'rgba(56,189,248,0.1)'  },
  balanced:     { color: 'var(--gold)',   border: 'rgba(251,191,36,0.35)',   bg: 'rgba(251,191,36,0.1)'  },
  aggressive:   { color: 'var(--red)',    border: 'rgba(255,77,109,0.35)',   bg: 'rgba(255,77,109,0.1)'  },
}
const MODE_DIM = { color: '#334155', border: 'rgba(255,255,255,0.06)', bg: 'transparent' }

/* ── Tool call expandable chip ────────────────────────── */
function ToolChip({ name, result }) {
  const [open, setOpen] = useState(false)
  const icon = TOOL_ICONS[name] || '🔧'
  const label = name.replace(/_/g, ' ')

  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '3px 10px', borderRadius: 20,
          background: 'rgba(56,189,248,0.07)',
          border: '1px solid rgba(56,189,248,0.18)',
          color: 'var(--blue)', fontSize: 11, cursor: 'pointer',
          fontFamily: 'JetBrains Mono, monospace',
          transition: 'border-color 0.15s',
        }}
        onMouseOver={e => e.currentTarget.style.borderColor='rgba(56,189,248,0.35)'}
        onMouseOut={e => e.currentTarget.style.borderColor='rgba(56,189,248,0.18)'}
      >
        <span>{icon}</span>
        <span>{label}</span>
        <span style={{ opacity: 0.4, fontSize: 9 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && result && (
        <pre style={{
          marginTop: 6, marginLeft: 10,
          padding: '8px 12px', borderRadius: 8,
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(56,189,248,0.1)',
          color: '#64748b', fontSize: 10,
          fontFamily: 'JetBrains Mono, monospace',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          maxHeight: 160, overflowY: 'auto', lineHeight: 1.7,
        }}>
          {result}
        </pre>
      )}
    </div>
  )
}

/* ── Message bubble ────────────────────────────────────── */
function Message({ msg }) {
  const isUser = msg.role === 'user'
  const text   = msg.content || msg.streaming || ''

  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginBottom: 14,
      animation: 'fadeIn 0.25s ease-out',
    }}>
      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700,
        background: isUser
          ? 'linear-gradient(135deg, #1e40af, #3b82f6)'
          : 'linear-gradient(135deg, #6d28d9, #2563eb)',
        boxShadow: isUser
          ? '0 0 12px rgba(59,130,246,0.4)'
          : '0 0 12px rgba(109,40,217,0.4)',
        marginTop: 2,
      }}>
        {isUser ? 'U' : 'A'}
      </div>

      {/* Content */}
      <div style={{ maxWidth: '82%', minWidth: 0 }}>
        {/* Tool calls */}
        {msg.toolCalls?.length > 0 && (
          <div style={{ marginBottom: 6 }}>
            {msg.toolCalls.map((tc, i) => <ToolChip key={i} name={tc.name} result={tc.result} />)}
          </div>
        )}

        {/* Bubble */}
        {text && (
          <div
            className={isUser ? 'bubble-user' : 'bubble-ai'}
            style={{
              padding: '10px 14px',
              borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
              fontSize: 13, lineHeight: 1.65,
              color: 'var(--text)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}
          >
            {text}
            {msg.isLoading && (
              <span style={{
                display: 'inline-block', width: 6, height: 14,
                background: 'var(--green)',
                marginLeft: 4, verticalAlign: 'middle',
                borderRadius: 1,
                animation: 'simplePulse 0.8s ease-in-out infinite',
              }} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Main ChatPanel ────────────────────────────────────── */
export default function ChatPanel({ state }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: '¡Hola! Soy ARIA — tu analista de trading IA.\n\nTengo acceso en tiempo real a tu portfolio, señales de mercado y puedo buscar información en internet. Puedo ajustar los parámetros del bot o forzar ventas con un mensaje.\n\n¿En qué te puedo ayudar?',
    toolCalls: [],
  }])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getHistory = () =>
    messages.filter(m => m.content).slice(-10).map(m => ({ role: m.role, content: m.content }))

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return
    setInput('')
    setLoading(true)

    setMessages(prev => [...prev,
      { role: 'user',      content: text, toolCalls: [] },
      { role: 'assistant', content: '', streaming: '', toolCalls: [], isLoading: true },
    ])

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: getHistory() }),
      })
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

      const reader  = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = '', currentText = '', currentToolCalls = []

      const patch = (updater) => setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = updater(copy[copy.length - 1])
        return copy
      })

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue
          try {
            const ev = JSON.parse(raw)
            if (ev.type === 'text') {
              currentText += ev.chunk
              patch(m => ({ ...m, streaming: currentText }))
            } else if (ev.type === 'tool_call') {
              currentToolCalls = [...currentToolCalls, { name: ev.name, result: null }]
              patch(m => ({ ...m, toolCalls: currentToolCalls }))
            } else if (ev.type === 'tool_result') {
              const idx = [...currentToolCalls].reverse().findIndex(t => t.name === ev.name && !t.result)
              if (idx >= 0) {
                currentToolCalls = currentToolCalls.map((t, i) =>
                  i === currentToolCalls.length - 1 - idx ? { ...t, result: ev.result } : t
                )
                patch(m => ({ ...m, toolCalls: currentToolCalls }))
              }
            } else if (ev.type === 'error') {
              currentText += `\n\n⚠️ ${ev.content}`
              patch(m => ({ ...m, streaming: currentText }))
            } else if (ev.type === 'done') {
              patch(m => ({ ...m, content: currentText, streaming: '', toolCalls: currentToolCalls, isLoading: false }))
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      setMessages(prev => {
        const copy = [...prev]
        copy[copy.length - 1] = { ...copy[copy.length - 1], content: `❌ ${e.message}`, streaming: '', isLoading: false }
        return copy
      })
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) }
  }

  const currentMode = state?.trading_config?.mode || 'balanced'

  return (
    <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 520 }}>

      {/* ── Header ─────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border)',
        background: 'linear-gradient(135deg, rgba(109,40,217,0.06) 0%, rgba(37,99,235,0.06) 100%)',
      }}>
        {/* ARIA identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 15, color: '#fff',
            background: 'linear-gradient(135deg, #6d28d9, #2563eb)',
            boxShadow: '0 0 16px rgba(109,40,217,0.5)',
          }}>A</div>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14, letterSpacing: '0.02em' }}>ARIA</div>
            <div style={{ color: 'var(--muted)', fontSize: 10, letterSpacing: '0.04em' }}>AI Trading Analyst · Claude Haiku</div>
          </div>
          <div className="live-dot" style={{ marginLeft: 4 }} />
        </div>

        {/* Mode switcher */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['conservative', 'balanced', 'aggressive'].map(mode => {
            const active = currentMode === mode
            const s = active ? MODE_STYLE[mode] : MODE_DIM
            return (
              <button key={mode}
                onClick={() => sendMessage(`Cambia a modo ${mode}`)}
                style={{
                  padding: '3px 10px', borderRadius: 20, fontSize: 10,
                  fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: s.color, border: `1px solid ${s.border}`, background: s.bg,
                  cursor: 'pointer', transition: 'all 0.15s',
                  textShadow: active ? `0 0 8px ${s.color}` : 'none',
                }}>
                {mode}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Messages ───────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* ── Quick actions ──────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 6,
        padding: '8px 16px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
      }}>
        {QUICK_ACTIONS.map(({ label, icon }) => (
          <button key={label}
            onClick={() => sendMessage(label)}
            disabled={loading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 20, fontSize: 11,
              color: '#64748b', cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.03)',
              transition: 'all 0.15s',
              opacity: loading ? 0.4 : 1,
            }}
            onMouseOver={e => { if (!loading) { e.currentTarget.style.color='var(--text)'; e.currentTarget.style.borderColor='rgba(56,189,248,0.3)' }}}
            onMouseOut={e => { e.currentTarget.style.color='#64748b'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)' }}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Input ──────────────────────────────────── */}
      <div style={{ padding: '10px 14px 14px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Pregunta a ARIA... (Enter para enviar, Shift+Enter nueva línea)"
            rows={1}
            disabled={loading}
            style={{
              flex: 1, background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(56,189,248,0.15)',
              borderRadius: 12, padding: '9px 14px',
              fontSize: 13, color: 'var(--text)',
              fontFamily: 'Inter, system-ui, sans-serif',
              resize: 'none', maxHeight: 80, lineHeight: 1.5,
              outline: 'none', transition: 'border-color 0.15s',
              opacity: loading ? 0.6 : 1,
            }}
            onFocus={e => e.target.style.borderColor='rgba(56,189,248,0.4)'}
            onBlur={e => e.target.style.borderColor='rgba(56,189,248,0.15)'}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            style={{
              width: 40, height: 40, borderRadius: 12, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: loading || !input.trim()
                ? 'rgba(30,64,175,0.3)'
                : 'linear-gradient(135deg, #1e40af, #2563eb)',
              border: '1px solid rgba(96,165,250,0.3)',
              color: '#fff', fontSize: 16, cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              boxShadow: !loading && input.trim() ? '0 0 12px rgba(37,99,235,0.4)' : 'none',
            }}>
            {loading ? (
              <div style={{ display: 'flex', gap: 2 }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 4, height: 4, borderRadius: '50%', background: 'rgba(255,255,255,0.6)',
                    animation: `simplePulse 1s ease-in-out ${i * 0.15}s infinite`,
                  }} />
                ))}
              </div>
            ) : '↑'}
          </button>
        </div>
      </div>
    </div>
  )
}
