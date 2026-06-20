import { join } from 'node:path'
import { app } from 'electron'
import Database from 'better-sqlite3'
import { addDays, isConsecutive, todayKey } from '../shared/date'
import type { Stats } from '../shared/types'

let db: Database.Database

interface DateRow {
  date_key: string
}

/** Open (creating if needed) the on-disk SQLite database and run migrations. */
export function initDb(): string {
  const dbPath = join(app.getPath('userData'), 'cadence.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS workouts (
      date_key   TEXT PRIMARY KEY,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  console.log('[cadence] sqlite database ready at', dbPath)
  return dbPath
}

/** All completed days as ISO keys, sorted ascending. */
export function getCompletedDates(): string[] {
  const rows = db
    .prepare('SELECT date_key FROM workouts ORDER BY date_key ASC')
    .all() as DateRow[]
  return rows.map((r) => r.date_key)
}

function isCompleted(key: string): boolean {
  return db.prepare('SELECT 1 FROM workouts WHERE date_key = ?').get(key) !== undefined
}

/** Toggle a day's completion. Returns the resulting completed state. */
export function toggleDay(key: string): boolean {
  if (isCompleted(key)) {
    db.prepare('DELETE FROM workouts WHERE date_key = ?').run(key)
    return false
  }
  db.prepare('INSERT INTO workouts (date_key) VALUES (?)').run(key)
  return true
}

/**
 * Compute streak stats over the full history.
 *
 * - `longestStreak`: the longest run of consecutive calendar days, ever.
 * - `currentStreak`: consecutive days counting back from today. If today
 *   isn't marked yet we count back from yesterday instead, so an active
 *   streak doesn't "break" simply because the day isn't over.
 */
export function computeStats(): Stats {
  const dates = getCompletedDates()
  const completed = new Set(dates)
  const totalDays = dates.length

  let longestStreak = 0
  let run = 0
  let prev: string | null = null
  for (const d of dates) {
    run = prev !== null && isConsecutive(prev, d) ? run + 1 : 1
    if (run > longestStreak) longestStreak = run
    prev = d
  }

  let currentStreak = 0
  let cursor = todayKey()
  if (!completed.has(cursor)) cursor = addDays(cursor, -1)
  while (completed.has(cursor)) {
    currentStreak += 1
    cursor = addDays(cursor, -1)
  }

  return { currentStreak, longestStreak, totalDays }
}
