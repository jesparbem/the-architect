const STATUS_CONFIG = {
  active:   { dot: 'bg-green-400', text: 'text-green-400',  label: 'ACTIVO'   },
  paused:   { dot: 'bg-yellow-400',text: 'text-yellow-400', label: 'PAUSADO'  },
  waiting:  { dot: 'bg-gray-500',  text: 'text-gray-500',   label: 'EN ESPERA'},
  error:    { dot: 'bg-red-400',   text: 'text-red-400',    label: 'ERROR'    },
}

const COLOR_MAP = {
  blue:   'border-blue-800/50 bg-blue-950/20',
  purple: 'border-purple-800/50 bg-purple-950/20',
  green:  'border-green-800/50 bg-green-950/20',
  yellow: 'border-yellow-800/50 bg-yellow-950/20',
  pink:   'border-pink-800/50 bg-pink-950/20',
}

function AgentCard({ agent }) {
  const s = STATUS_CONFIG[agent.status] || STATUS_CONFIG.active
  const border = COLOR_MAP[agent.color] || 'border-gray-800 bg-gray-900/20'

  return (
    <div className={`rounded-xl border p-3 ${border}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{agent.icon}</span>
          <div>
            <div className="text-white text-xs font-bold">{agent.name}</div>
            <div className="text-gray-500 text-xs">{agent.role}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${agent.status === 'active' ? 'pulse-dot' : ''}`} />
          <span className={`text-xs font-bold ${s.text}`}>{s.label}</span>
        </div>
      </div>
      <p className="text-gray-500 text-xs mt-2 leading-relaxed">{agent.description}</p>
      {agent.stats && (
        <div className="mt-2 text-xs font-mono text-gray-400 bg-black/20 rounded px-2 py-1">
          {agent.stats}
        </div>
      )}
      {agent.interval_s && (
        <div className="mt-1 text-gray-700 text-xs">
          Intervalo: {agent.interval_s}s
        </div>
      )}
    </div>
  )
}

export default function AgentsPanel({ agents = [] }) {
  const activeCount = agents.filter(a => a.status === 'active').length

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-gray-400 text-sm uppercase tracking-wider">
          🧠 Agentes Activos
        </h2>
        <span className="text-xs text-gray-500">
          <span className="text-green-400 font-bold">{activeCount}</span>/{agents.length} activos
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {agents.map(a => <AgentCard key={a.id} agent={a} />)}
      </div>
    </div>
  )
}
