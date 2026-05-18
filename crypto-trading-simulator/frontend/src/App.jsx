import { useState, useEffect, useRef, useCallback } from 'react'
import Dashboard from './components/Dashboard.jsx'

const WS_URL = `ws://${window.location.hostname}:8000/ws`

export default function App() {
  const [state, setState] = useState(null)
  const [connected, setConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      console.log('Connected to trading engine')
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'state_update') {
        setState(msg.data)
        setLastUpdate(new Date())
      }
    }

    ws.onclose = () => {
      setConnected(false)
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  // Ping every 25s to keep alive
  useEffect(() => {
    const timer = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping')
      }
    }, 25000)
    return () => clearInterval(timer)
  }, [])

  const handleReset = async () => {
    if (!confirm('Reset portfolio to $50.00?')) return
    await fetch('/api/reset', { method: 'POST' })
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Dashboard
        state={state}
        connected={connected}
        lastUpdate={lastUpdate}
        onReset={handleReset}
      />
    </div>
  )
}
