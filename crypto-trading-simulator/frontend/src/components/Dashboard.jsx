import PortfolioCard from './PortfolioCard.jsx'
import PriceTable from './PriceTable.jsx'
import TradeHistory from './TradeHistory.jsx'
import AgentLog from './AgentLog.jsx'
import PerformanceChart from './PerformanceChart.jsx'

function StatusDot({ connected }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 pulse-dot' : 'bg-red-400'}`} />
      <span className={`text-xs ${connected ? 'text-green-400' : 'text-red-400'}`}>
        {connected ? 'LIVE' : 'RECONNECTING'}
      </span>
    </span>
  )
}

export default function Dashboard({ state, connected, lastUpdate, onReset }) {
  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">&#x1F916;</div>
          <div className="text-green-400 text-xl animate-pulse">Initializing Trading Engine...</div>
          <div className="text-gray-500 text-sm mt-2">Connecting to market data</div>
        </div>
      </div>
    )
  }

  const { portfolio, signals, agent_log, cycle_count, day_count, market_data } = state

  return (
    <div className="max-w-[1800px] mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span>&#x1F916;</span>
            <span>Crypto AI Trader</span>
            <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded border border-green-800">
              PAPER TRADING
            </span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Day {day_count} &middot; Cycle #{cycle_count} &middot; Data: CoinGecko Live
          </p>
        </div>
        <div className="flex items-center gap-4">
          <StatusDot connected={connected} />
          {lastUpdate && (
            <span className="text-gray-600 text-xs">
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={onReset}
            className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-gray-400"
          >
            Reset ($50)
          </button>
        </div>
      </div>

      {/* Portfolio Cards Row */}
      <PortfolioCard portfolio={portfolio} />

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-4 mt-4">

        {/* Performance Chart - spans 8 cols */}
        <div className="col-span-12 lg:col-span-8">
          <PerformanceChart history={portfolio?.portfolio_history || []} />
        </div>

        {/* Agent Log - spans 4 cols */}
        <div className="col-span-12 lg:col-span-4">
          <AgentLog logs={agent_log || []} />
        </div>

        {/* Market Signals Table - spans 7 cols */}
        <div className="col-span-12 lg:col-span-7">
          <PriceTable
            signals={signals || []}
            positions={portfolio?.positions || {}}
          />
        </div>

        {/* Trade History - spans 5 cols */}
        <div className="col-span-12 lg:col-span-5">
          <TradeHistory trades={portfolio?.trades || []} />
        </div>
      </div>
    </div>
  )
}
