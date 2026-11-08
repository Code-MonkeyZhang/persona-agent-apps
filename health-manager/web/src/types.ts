// Shared types — mirror the WS protocol defined by the Python server.

export type AbnormalFlag = 'H' | 'L'

export interface LabResult {
  id: number
  date: string
  specimen: string | null
  category: string
  analyte: string
  valueNum: number | null
  valueText: string | null
  unit: string | null
  refLow: number | null
  refHigh: number | null
  refText: string | null
  abnormalFlag: AbnormalFlag | null
  note: string | null
}

export interface ImagingFinding {
  id: number
  date: string
  examType: string
  findingText: string
  imageRef: string | null
  note: string | null
}

export interface JournalEntry {
  date: string
  title: string | null
  content: string | null
  updatedAt: string | null
}

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

/** One dictionary analyte served with the snapshot. */
export interface DictItem {
  g: string
  s: string
  u: string
  r: string | null
  a: string[]
  lo: number | null
  hi: number | null
}

/** Lab dictionary served with the snapshot: group order, item metadata, subcategory members. */
export interface LabDictionary {
  groups: string[]
  items: Record<string, DictItem>
  subs: Record<string, [string, string[]]>
}

export interface DiseaseState {
  labResults: LabResult[]
  imagingFindings: ImagingFinding[]
  journal: JournalEntry[]
  journalBasics: JournalEntry | null
  labDictionary: LabDictionary | null
}

export interface ServerMessage {
  type: 'init' | 'update' | 'error'
  basics?: BasicsState
  diet?: DietState
  fitness?: FitnessState
  disease?: DiseaseState
  mockOn?: boolean
  version?: string
  schemaVersion?: number
  message?: string
}

export type Tab = 'summary' | 'diet' | 'fitness' | 'disease'
