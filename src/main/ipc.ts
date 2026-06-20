import { ipcMain } from 'electron'
import { computeStats, getCompletedDates, toggleDay } from './db'
import { dateKey, isFuture, parseKey } from '../shared/date'
import type { AppState, ToggleResult } from '../shared/types'

const KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function assertValidKey(key: unknown): asserts key is string {
  if (typeof key !== 'string' || !KEY_PATTERN.test(key)) {
    throw new Error(`Invalid date key: ${String(key)}`)
  }
  // Shape isn't enough — reject impossible calendar dates (e.g. 2026-02-30),
  // which parseKey would silently roll over and corrupt streak math.
  if (dateKey(parseKey(key)) !== key) {
    throw new Error(`Invalid calendar date: ${key}`)
  }
}

/** Wire up the renderer-facing IPC handlers. Call once after the DB is ready. */
export function registerIpcHandlers(): void {
  ipcMain.handle('cadence:getState', (): AppState => {
    return {
      completedDates: getCompletedDates(),
      stats: computeStats()
    }
  })

  ipcMain.handle('cadence:toggleDay', (_event, rawKey: unknown): ToggleResult => {
    assertValidKey(rawKey)
    // Guard against marking days that haven't happened yet.
    if (isFuture(rawKey)) {
      throw new Error(`Cannot mark a future day: ${rawKey}`)
    }
    const completed = toggleDay(rawKey)
    return { dateKey: rawKey, completed, stats: computeStats() }
  })
}
