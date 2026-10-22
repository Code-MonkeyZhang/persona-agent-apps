import { useState, useCallback } from 'react'
import { SNAPSHOT } from '../mock/snapshot'
import type {
  BasicsState,
  DietState,
  DiseaseState,
  FitnessState,
  GoalMode,
} from './types'

const init = SNAPSHOT as unknown as {
  basics?: BasicsState
  diet?: DietState
  fitness?: FitnessState
  disease?: DiseaseState
  mockOn?: boolean
  version?: string
  schemaVersion?: number
}

/**
 * Demo variant of the WebSocket hook. Same interface and state shape as the
 * real one, but the snapshot comes from a static dump of the mock database
 * instead of a live server, and every mutating action is an inert no-op so
 * the UI stays a pure render of the captured design.
 */
export function useHealthData() {
  const [basics] = useState<BasicsState>(
    init.basics ?? { profile: null, metrics: [] }
  )
  const [diet] = useState<DietState>(
    init.diet ?? {
      entries: [],
      goal: null,
      goalMode: 'auto',
      macroGoals: { carbs: null, protein: null, fat: null },
    }
  )
  const [fitness] = useState<FitnessState>(
    init.fitness ?? { strengthRecords: [], workouts: [] }
  )
  const [disease] = useState<DiseaseState>(
    init.disease ?? {
      labResults: [],
      imagingFindings: [],
      journal: [],
      journalBasics: null,
    }
  )
  const [mockOn] = useState(init.mockOn ?? true)
  const [version] = useState(init.version ?? '')
  const [schemaVersion] = useState(init.schemaVersion ?? 0)

  const noop = useCallback(() => {}, [])
  const setHeight = useCallback((_height: number) => noop(), [noop])
  const setName = useCallback((_name: string) => noop(), [noop])
  const setDietGoal = useCallback((_goal: number) => noop(), [noop])
  const setGoalMode = useCallback((_mode: GoalMode) => noop(), [noop])
  const setMacroGoals = useCallback(
    (_carbs: number, _protein: number, _fat: number) => noop(),
    [noop]
  )
  const toggleMock = useCallback(() => noop(), [noop])
  const setJournal = useCallback(
    (_date: string, _content: string) => noop(),
    [noop]
  )
  const setJournalBasics = useCallback((_content: string) => noop(), [noop])

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
