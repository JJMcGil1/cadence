/** Stats computed over the full training history. */
export interface Stats {
  /** Consecutive completed days ending today (or yesterday, if today isn't done yet). */
  currentStreak: number
  /** Longest run of consecutive completed days ever recorded. */
  longestStreak: number
  /** Total number of completed days. */
  totalDays: number
}

/** Full application state handed to the renderer on load. */
export interface AppState {
  /** Every completed day as an ISO `YYYY-MM-DD` key, sorted ascending. */
  completedDates: string[]
  stats: Stats
}

/** Result of toggling a single day. */
export interface ToggleResult {
  dateKey: string
  completed: boolean
  stats: Stats
}

/** The API surface exposed to the renderer via `window.cadence`. */
export interface CadenceApi {
  getState(): Promise<AppState>
  toggleDay(dateKey: string): Promise<ToggleResult>
}
