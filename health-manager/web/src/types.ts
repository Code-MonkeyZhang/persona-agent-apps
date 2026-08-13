// Shared types — mirror the WS protocol defined by the Python server.

export interface Profile {
  height: number | null
  name: string | null
  updatedAt?: string
}

export interface Metric {
  date: string
  weight: number | null
  systolic: number | null
  diastolic: number | null
  heartRate: number | null
  note: string | null
}

export interface StrengthRecord {
  date: string
  exercise: string
  metric: string
  value: number
  unit: string | null
  category: string | null
  note: string | null
}

export interface WorkoutEntry {
  id: number
  date: string
  exercise: string
  sets: number | null
  reps: number | null
  weight: number | null
  feeling: string | null
  calories: number | null
  note: string | null
}

export type Meal = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface DietEntry {
  id: number
  date: string
  meal: Meal | null
  food: string
  quantity: string | null
  calories: number
  carbs: number | null
  protein: number | null
  fat: number | null
  note: string | null
}

export type GoalMode = 'auto' | 'manual'

export interface MacroGoals {
  carbs: number | null
  protein: number | null
  fat: number | null
}

export interface BasicsState {
  profile: Profile | null
  metrics: Metric[]
}

export interface DietState {
  entries: DietEntry[]
  goal: number | null
  goalMode: GoalMode
  macroGoals: MacroGoals
}

export interface FitnessState {
  strengthRecords: StrengthRecord[]
  workouts: WorkoutEntry[]
}

export interface ServerMessage {
  type: 'init' | 'update' | 'error'
  basics?: BasicsState
  diet?: DietState
  fitness?: FitnessState
  mockOn?: boolean
  version?: string
  schemaVersion?: number
  message?: string
}

export type Tab = 'summary' | 'diet' | 'fitness' | 'disease'
