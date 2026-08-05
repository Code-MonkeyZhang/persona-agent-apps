import { useEffect, useRef, useState, useCallback } from 'react'
import type { Profile, Metric, ServerMessage } from './types'

/**
 * WebSocket hook: owns the single source of truth for profile + metrics.
 * Auto-reconnects 2s after the socket drops. The server pushes full state
 * on every change, so the frontend stays a pure render layer.
 */
export function useHealthData() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [metrics, setMetrics] = useState<Metric[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let cancelled = false
    let reconnectTimer: ReturnType<typeof setTimeout>

    const connect = () => {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
      const base = location.host + location.pathname.replace(/\/$/, '')
      const ws = new WebSocket(proto + '//' + base + '/ws')
      wsRef.current = ws

      ws.onmessage = (e) => {
        const msg: ServerMessage = JSON.parse(e.data)
        if (msg.type === 'error') return
        if (msg.profile !== undefined) setProfile(msg.profile ?? null)
        if (msg.metrics !== undefined) setMetrics(msg.metrics)
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

  const setHeight = useCallback((height: number) => {
    wsRef.current?.send(JSON.stringify({ type: 'set_height', height }))
  }, [])

  return { profile, metrics, setHeight }
}
