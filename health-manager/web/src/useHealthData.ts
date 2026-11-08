import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'
import type {
  BasicsState,
  DietState,
  DiseaseState,
  FitnessState,
  GoalMode,
  ServerMessage,
} from './types'
import { useI18n } from './i18n'
import { ENTRY_BASE } from './lib/router'

/**
 * WebSocket hook: owns the single source of truth for all module state plus
 * server meta (mock flag, versions). Auto-reconnects 2s after the socket drops.
 * The server pushes full state (namespaced by module) on every change, so the
 * frontend stays a pure render layer. Writes are fire-and-forget: success is
 * confirmed locally and failures come back through the error channel.
 */
export function useHealthData() {
  const { t } = useI18n()
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
  const [disease, setDisease] = useState<DiseaseState>({
    labResults: [],
    imagingFindings: [],
    journal: [],
    journalBasics: null,
    labDictionary: null,
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
      if (msg.disease) setDisease(msg.disease)
      if (msg.mockOn !== undefined) setMockOn(msg.mockOn)
      if (msg.version !== undefined) setVersion(msg.version)
      if (msg.schemaVersion !== undefined) setSchemaVersion(msg.schemaVersion)
    }

    const connect = () => {
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
      const ws = new WebSocket(proto + '//' + location.host + ENTRY_BASE + '/ws')
      wsRef.current = ws

      ws.onmessage = (e) => {
        const msg: ServerMessage = JSON.parse(e.data)
        if (msg.type === 'error') {
          // Rejected writes surface as a toast instead of being dropped.
          toast.error(msg.message || t('common.serverError'))
          return
        }
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

  // Every setter sends over WS and confirms locally; the server echoes the
  // full state and reports failures through the error channel.
  const setHeight = useCallback(
    (height: number) => {
      send({ type: 'set_height', height })
      toast.success(t('common.saved'))
    },
    [send, t]
  )
  const setName = useCallback(
    (name: string) => {
      send({ type: 'set_name', name })
      toast.success(t('common.saved'))
    },
    [send, t]
  )
  const setDietGoal = useCallback(
    (goal: number) => {
      send({ type: 'set_diet_goal', goal })
      toast.success(t('common.saved'))
    },
    [send, t]
  )
  const setGoalMode = useCallback(
    (mode: GoalMode) => {
      send({ type: 'set_goal_mode', mode })
      toast.success(t('common.saved'))
    },
    [send, t]
  )
  const setMacroGoals = useCallback(
    (carbs: number, protein: number, fat: number) => {
      send({ type: 'set_macro_goals', carbs, protein, fat })
      toast.success(t('common.saved'))
    },
    [send, t]
  )
  // Mock toggling is a debug switch and stays silent.
  const toggleMock = useCallback(() => send({ type: 'toggle_mock' }), [send])
  const setJournal = useCallback(
    (date: string, content: string) => {
      send({ type: 'set_journal', date, content })
      toast.success(t('common.saved'))
    },
    [send, t]
  )
  const setJournalBasics = useCallback(
    (content: string) => {
      send({ type: 'set_basics', content })
      toast.success(t('common.saved'))
    },
    [send, t]
  )

  return {
    basics,
    diet,
    fitness,
    disease,
    mockOn,
    version,
    schemaVersion,
    setHeight,
    setName,
    setDietGoal,
    setGoalMode,
    setMacroGoals,
    toggleMock,
    setJournal,
    setJournalBasics,
  }
}
