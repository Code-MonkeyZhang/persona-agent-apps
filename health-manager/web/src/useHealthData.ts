import { useEffect, useRef, useState, useCallback } from 'react'
import type {
  BasicsState,
  DietState,
  FitnessState,
  GoalMode,
  ServerMessage,
} from './types'

/**
 * WebSocket hook: owns the single source of truth for all module state plus
 * server meta (mock flag, versions). Auto-reconnects 2s after the socket drops.
 * The server pushes full state (namespaced by module) on every change, so the
 * frontend stays a pure render layer.
 */
export function useHealthData() {
  const [basics, setBasics] = useState<BasicsState>({ profile: null, metrics: [] })
  const [diet, setDiet] = useState<DietState>({
    entries: [],
    goal: null,
    goalMode: 'auto',
    macroGoals: { carbs: null, protein: null, fat: null },
  })
  const [fitness, setFitness] = useState<FitnessState>({
    strengthRecords: [],
    workouts: [],
  })
  const [mockOn, setMockOn] = useState(false)
  const [version, setVersion] = useState('')
  const [schemaVersion, setSchemaVersion] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let cancelled = false
    let reconnectTimer: ReturnType<typeof setTimeout>

    const apply = (msg: ServerMessage) => {
      if (msg.basics) setBasics(msg.basics)
      if (msg.diet) setDiet(msg.diet)
      if (msg.fitness) setFitness(msg.fitness)
      if (msg.mockOn !== undefined) setMockOn(msg.mockOn)
      if (msg.version !== undefined) setVersion(msg.version)
      if (msg.schemaVersion !== undefined) setSchemaVersion(msg.schemaVersion)
    }

    const connect = () => {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
      const base = location.host + location.pathname.replace(/\/$/, '')
      const ws = new WebSocket(proto + '//' + base + '/ws')
      wsRef.current = ws

      ws.onmessage = (e) => {
        const msg: ServerMessage = JSON.parse(e.data)
        if (msg.type === 'error') return
        apply(msg)
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

  const send = useCallback((payload: object) => {
    wsRef.current?.send(JSON.stringify(payload))
  }, [])

  const setHeight = useCallback((height: number) => send({ type: 'set_height', height }), [send])
  const setName = useCallback((name: string) => send({ type: 'set_name', name }), [send])
  const setDietGoal = useCallback((goal: number) => send({ type: 'set_diet_goal', goal }), [send])
  const setGoalMode = useCallback(
    (mode: GoalMode) => send({ type: 'set_goal_mode', mode }),
    [send]
  )
  const setMacroGoals = useCallback(
    (carbs: number, protein: number, fat: number) =>
      send({ type: 'set_macro_goals', carbs, protein, fat }),
    [send]
  )
  const toggleMock = useCallback(() => send({ type: 'toggle_mock' }), [send])

  return {
    basics,
    diet,
    fitness,
    mockOn,
    version,
    schemaVersion,
    setHeight,
    setName,
    setDietGoal,
    setGoalMode,
    setMacroGoals,
    toggleMock,
  }
}
