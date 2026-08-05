// Shared types — mirror the WS protocol defined by the Python server.

export interface Profile {
  height: number | null
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

export interface ServerMessage {
  type: 'init' | 'update' | 'error'
  profile?: Profile | null
  metrics?: Metric[]
  message?: string
}

export type View =
  | 'overview'
  | 'profile'
  | 'weight'
  | 'blood_pressure'
