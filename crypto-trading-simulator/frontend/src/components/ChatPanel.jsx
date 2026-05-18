import { useState, useRef, useEffect } from 'react'

const QUICK_ACTIONS = [
  '¿Qué debería comprar ahora?',
  'Analiza mi portfolio',
  '¿Cuáles tienen potencial +300%?',
  'Sé más agresivo',
  'Modo conservador',
  'Pausa el bot',
]

function ToolCallChip({ name, result }) {
  const [open, setOpen] = useState(false)
  const icons = {
    get_portfolio_state: '💼',
    get_market_signals: '📊',
    adjust_trading_params: '⚙️',
    force_sell: '🔴',
    pause_trading: '⏸️',
    web_search: '🔍',
  }
  return (
    <div className="my-1">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs text-gray-400 hover:bg-gray-700 transition-colors"
      >
        <span>{icons[name] || '🔧'}</span>
        <span className="font-mono">{name.replace(/_/g, ' ')}</span>
        <span className="text-gray-600">{open ? '▲' : '▼'}</span>
      </button>
      {open && result && (
        <pre className="mt-1 ml-2 text-xs text-gray-500 bg-gray-900 border border-gray-800 rounded p-2 whitespace-pre-wrap max-h-40 overflow-y-auto font-mono">
          {result}
        </pre>
      )}
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xs flex-shrink-0 mr-2 mt-0.5">
          A
        </div>
      )}
      <div className={`max-w-[82%] ${isUser ? 'order-first' : ''}`}>
        {msg.toolCalls?.map((tc, i) => (
          <ToolCallChip key={i} name={tc.name} result={tc.result} />
        ))}
        {(msg.content || msg.streaming) && (
          <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-blue-600/80 text-white rounded-tr-sm'
              : 'bg-gray-800/80 border border-gray-700/50 text-gray-100 rounded-tl-sm'
          }`}>
            {msg.content || msg.streaming}
            {msg.isLoading && <span className="inline-block w-1.5 h-4 bg-green-400 ml-1 animate-pulse rounded-sm" />}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs flex-shrink-0 ml-2 mt-0.5">
          U
        </div>
      )}
    </div>
  )
}

export default function ChatPanel({ state }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '¡Hola! Soy **ARIA** — tu analista de trading IA. Tengo acceso en tiempo real a tu portfolio, señales de mercado y puedo buscar en internet.\n\n¿En qué te puedo ayudar?',
      toolCalls: []
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getHistory = () =>
    messages
      .filter(m => m.role !== 'system' && m.content)
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }))

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return
    setInput('')
    setIsLoading(true)

    const userMsg = { role: 'user', content: text, toolCalls: [] }
    setMessages(prev => [...prev, userMsg])

    const assistantMsg = { role: 'assistant', content: '', streaming: '', toolCalls: [], isLoading: true }
    setMessages(prev => [...prev, assistantMsg])
    const assistantIdx = messages.length + 1

    try {
      const resp = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: getHistory() })
      })

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`)

      const reader = resp.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let currentText = ''
      let currentToolCalls = []

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
            const event = JSON.parse(raw)
            if (event.type === 'text') {
              currentText += event.chunk
              setMessages(prev => {
                const copy = [...prev]
                const idx = copy.length - 1
                copy[idx] = { ...copy[idx], streaming: currentText, isLoading: true }
                return copy
              })
            } else if (event.type === 'tool_call') {
              currentToolCalls.push({ name: event.name, result: null })
              setMessages(prev => {
                const copy = [...prev]
                const idx = copy.length - 1
                copy[idx] = { ...copy[idx], toolCalls: [...currentToolCalls] }
                return copy
              })
            } else if (event.type === 'tool_result') {
              const last = currentToolCalls.findLastIndex(t => t.name === event.name && !t.result)
              if (last >= 0) currentToolCalls[last].result = event.result
              setMessages(prev => {
                const copy = [...prev]
                const idx = copy.length - 1
                copy[idx] = { ...copy[idx], toolCalls: [...currentToolCalls] }
                return copy
              })
            } else if (event.type === 'error') {
              currentText += `\n\n⚠️ ${event.content}`
            } else if (event.type === 'done') {
              setMessages(prev => {
                const copy = [...prev]
                const idx = copy.length - 1
                copy[idx] = {
                  ...copy[idx],
                  content: currentText,
                  streaming: '',
                  toolCalls: currentToolCalls,
                  isLoading: false
                }
                return copy
              })
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      setMessages(prev => {
        const copy = [...prev]
        const idx = copy.length - 1
        copy[idx] = {
          ...copy[idx],
          content: `❌ Error de conexión: ${e.message}`,
          streaming: '',
          isLoading: false
        }
        return copy
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-sm font-bold">
            A
          </div>
          <div>
            <div className="text-white text-sm font-bold">ARIA</div>
            <div className="text-gray-500 text-xs">AI Trading Analyst · Claude Haiku</div>
          </div>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 pulse-dot ml-1" />
        </div>
        <div className="flex gap-1">
          {['conservative', 'balanced', 'aggressive'].map(mode => {
            const current = state?.trading_config?.mode === mode
            const colors = {
              conservative: 'text-blue-400 border-blue-800',
              balanced: 'text-yellow-400 border-yellow-800',
              aggressive: 'text-red-400 border-red-800'
            }
            return (
              <button
                key={mode}
                onClick={() => sendMessage(`Cambia a modo ${mode}`)}
                className={`px-2 py-0.5 text-xs border rounded transition-all ${
                  current
                    ? colors[mode] + ' bg-gray-800'
                    : 'text-gray-600 border-gray-800 hover:border-gray-600'
                }`}
              >
                {mode}
              </button>
            )
          })}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      {/* Quick actions */}
      <div className="px-4 py-2 border-t border-gray-800/50 flex gap-1.5 flex-wrap">
        {QUICK_ACTIONS.map(action => (
          <button
            key={action}
            onClick={() => sendMessage(action)}
            disabled={isLoading}
            className="px-2 py-1 text-xs bg-gray-800/60 hover:bg-gray-700 border border-gray-700/50 rounded-full text-gray-400 hover:text-white transition-all disabled:opacity-40"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-800">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Pregunta al agente... (Enter para enviar)"
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-gray-500 disabled:opacity-50 font-sans"
            style={{ maxHeight: '80px' }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm transition-all flex-shrink-0"
          >
            {isLoading ? '...' : '↑'}
          </button>
        </div>
      </div>
    </div>
  )
}
