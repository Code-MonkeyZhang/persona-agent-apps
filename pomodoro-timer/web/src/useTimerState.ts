import { useCallback, useEffect, useRef, useState } from 'react'
import type { FocusSession, Stats, TimerSettings, TimerState } from './types'

export function useTimerState() {
  const [state, setState] = useState<TimerState | null>(null)
  const [history, setHistory] = useState<FocusSession[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [monthSessions, setMonthSessions] = useState<FocusSession[]>([])
  const [now, setNow] = useState(Date.now())
  const wsRef = useRef<WebSocket | null>(null)

  // --- WebSocket connect + auto-reconnect ---
  useEffect(() => {
    let cancelled = false
    let reconnectTimer: ReturnType<typeof setTimeout>

    const connect = () => {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
      const base = location.host + location.pathname.replace(/\/$/, '')
      const ctx = location.search
      const ws = new WebSocket(proto + '//' + base + '/ws' + ctx)
      wsRef.current = ws

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data)
        if (msg.type === 'init') {
          setState(msg.state)
          setHistory(msg.history || [])
          setStats(msg.stats || null)
        } else if (msg.type === 'state') {
          setState(msg.state)
        } else if (msg.type === 'data') {
          setHistory(msg.history || [])
          setStats(msg.stats || null)
        } else if (msg.type === 'month_data') {
          setMonthSessions(msg.sessions || [])
        }
      }

      ws.onclose = () => {
        if (!cancelled) reconnectTimer = setTimeout(connect, 2000)
      }
    }
    connect()

    return () => {
      cancelled = true
      clearTimeout(reconnectTimer)
      wsRef.current?.close()
    }
  }, [])

  // --- Local countdown tick (1s interval while running) ---
  useEffect(() => {
    if (!state?.running || !state.ends_at) return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [state?.running, state?.ends_at])

  // --- Compute remaining seconds from ends_at or paused value ---
  const remainingSeconds = state
    ? state.running && state.ends_at
      ? Math.max(0, Math.floor((state.ends_at - now) / 1000))
      : state.remaining_seconds
    : 0

  // --- Send callbacks ---
  const send = useCallback((msg: object) => {
    wsRef.current?.send(JSON.stringify(msg))
  }, [])

  const sendStart = useCallback(
    (intent: string, durationMin?: number) => send({ type: 'start', intent, duration_min: durationMin }),
    [send]
  )
  const sendPause = useCallback(() => send({ type: 'pause' }), [send])
  const sendResume = useCallback(() => send({ type: 'resume' }), [send])
  const sendStop = useCallback(() => send({ type: 'stop' }), [send])
  const sendUpdateSettings = useCallback(
    (settings: TimerSettings) => send({ type: 'update_settings', settings }),
    [send]
  )
  const sendGetMonth = useCallback(
    (year: number, month: number) => send({ type: 'get_month', year, month }),
    [send]
  )

  return {
    state,
    history,
    stats,
    monthSessions,
    remainingSeconds,
    sendStart,
    sendPause,
    sendResume,
    sendStop,
    sendUpdateSettings,
    sendGetMonth,
  }
}
