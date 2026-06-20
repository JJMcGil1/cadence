import { dateKey } from '../../../shared/date'

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
] as const

/** A single cell in the month grid. `null` keys are leading/trailing padding. */
export interface DayCell {
  key: string | null
  day: number | null
}

/**
 * Build a 6-row (42-cell) Monday-first grid for the given month.
 * A fixed cell count keeps the calendar's height stable across months.
 */
export function buildMonthGrid(year: number, month: number): DayCell[] {
  const first = new Date(year, month, 1)
  // JS getDay(): 0=Sun..6=Sat. Shift so Monday=0..Sunday=6.
  const leadingBlanks = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: DayCell[] = []
  for (let i = 0; i < leadingBlanks; i++) cells.push({ key: null, day: null })
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ key: dateKey(new Date(year, month, d)), day: d })
  }
  while (cells.length < 42) cells.push({ key: null, day: null })
  return cells
}

/** Count how many completed days fall within the given month. */
export function countInMonth(completed: Set<string>, year: number, month: number): number {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`
  let n = 0
  for (const key of completed) if (key.startsWith(prefix)) n++
  return n
}
