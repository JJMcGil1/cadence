/**
 * Date helpers built around a local `YYYY-MM-DD` key.
 *
 * We deliberately avoid `new Date('2026-06-20')` (which parses as UTC midnight
 * and can land on the wrong calendar day in negative-offset timezones). Every
 * key is derived from *local* date components instead.
 */

/** Local `YYYY-MM-DD` key for a Date. */
export function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse a `YYYY-MM-DD` key into a local-midnight Date. */
export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Today's key in local time. */
export function todayKey(): string {
  return dateKey(new Date())
}

/** Add (or subtract) whole days to a key, returning a new key. */
export function addDays(key: string, delta: number): string {
  const d = parseKey(key)
  d.setDate(d.getDate() + delta)
  return dateKey(d)
}

/**
 * Are two keys consecutive calendar days? (`a` immediately before `b`.)
 * Uses real date math so month/year boundaries are handled correctly.
 */
export function isConsecutive(a: string, b: string): boolean {
  return addDays(a, 1) === b
}

/** Is this key strictly after today? ISO keys sort lexicographically. */
export function isFuture(key: string): boolean {
  return key > todayKey()
}
