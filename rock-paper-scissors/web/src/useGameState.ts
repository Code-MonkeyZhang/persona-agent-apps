import { useEffect, useRef, useState, useCallback } from 'react'
import type { GameState, GameHistory, ServerMessage } from './types'

/**
 * WebSocket hook: owns the single source of truth for match state + history.
 * Auto-reconnects 2s after the socket drops. The server pushes full state
 * on every change, so the frontend stays a pure render layer.
 *
 * The page is loaded by the desktop with ?agentId&sessionId in the URL; those
 * are forwarded as the WS query string so the server can attribute user
 * actions (start/move/rematch) to the right agent+session for notifications.
 */
export function useGameState() {
  const [state, setState] = useState<GameState | null>(null)
  const [history, setHistory] = useState<GameHistory[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let cancelled = false
    let reconnectTimer: ReturnType<typeof setTimeout>

    const connect = () => {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
      const base = location.host + location.pathname.replace(/\/$/, '')
      const ctx = location.search // ?agentId=...&sessionId=...
      const ws = new WebSocket(proto + '//' + base + '/ws' + ctx)
      wsRef.current = ws

      ws.onmessage = (e) => {
        const msg: ServerMessage = JSON.parse(e.data)
        setState(msg.state)
        setHistory(msg.history || [])
      }

      ws.onclose = () => {
        if (!cancelled) {
          reconnectTimer = setTimeout(connect, 2000)
        }
      }
    }

    connect()
    return () => {
      cancelled = true
      clearTimeout(reconnectTimer)
      wsRef.current?.close()
    }
  }, [])

  const sendMove = useCallback((move: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'move', move }))
  }, [])

  const requestRematch = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'rematch' }))
  }, [])

  const requestStartGame = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'start_game' }))
  }, [])

  const requestEndGame = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'end_game' }))
  }, [])

  return { state, history, sendMove, requestRematch, requestStartGame, requestEndGame }
}
