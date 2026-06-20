import { useCallback, useEffect, useMemo, useState } from 'react'
import Calendar from './components/Calendar'
import StatsBar from './components/StatsBar'
import { CheckIcon, MoonIcon, SunIcon } from './components/icons'
import { countInMonth, MONTH_NAMES } from './lib/calendar'
import { applyTheme, getInitialTheme, saveTheme, type Theme } from './lib/theme'
import { dateKey } from '../../shared/date'
import type { Stats } from '../../shared/types'

const EMPTY_STATS: Stats = { currentStreak: 0, longestStreak: 0, totalDays: 0 }

export default function App() {
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState<Stats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)

  // `now` is state, not a render-time `new Date()`, so the app's notion of
  // "today" stays correct when it's left open across midnight. It's refreshed
  // by a timer armed for the next local midnight and on window focus.
  const [now, setNow] = useState(() => new Date())
  const today = dateKey(now)

  const [view, setView] = useState(() => ({ year: now.getFullYear(), month: now.getMonth() }))

  const [theme, setTheme] = useState<Theme>(() => getInitialTheme())
  useEffect(() => {
    applyTheme(theme)
  }, [theme])
  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      saveTheme(next)
      return next
    })
  }, [])

  const reload = useCallback(() => {
    return window.cadence
      .getState()
      .then((state) => {
        setCompleted(new Set(state.completedDates))
        setStats(state.stats)
      })
      .catch((err) => console.error('[cadence] failed to load state', err))
  }, [])

  // Initial load from the SQLite-backed main process.
  useEffect(() => {
    let alive = true
    window.cadence
      .getState()
      .then((state) => {
        if (!alive) return
        setCompleted(new Set(state.completedDates))
        setStats(state.stats)
      })
      .catch((err) => console.error('[cadence] failed to load state', err))
      .finally(() => alive && setLoading(false))
    return () => {
      alive = false
    }
  }, [])

  // Keep "today" honest while the window stays open. Re-arm at each local
  // midnight, and also resync when the user returns to the window — long
  // setTimeouts can fire late/early after the machine sleeps.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      setNow(new Date())
      reload()
    }
    const armMidnight = () => {
      const d = new Date()
      const nextMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 1)
      timer = setTimeout(() => {
        tick()
        armMidnight()
      }, nextMidnight.getTime() - d.getTime())
    }
    armMidnight()

    const onFocus = () => tick()
    const onVisible = () => {
      if (!document.hidden) tick()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [reload])

  const toggle = useCallback(async (key: string) => {
    // Optimistic update for instant feedback; reconcile with the truth after.
    setCompleted((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    try {
      const result = await window.cadence.toggleDay(key)
      setStats(result.stats)
      setCompleted((prev) => {
        const next = new Set(prev)
        if (result.completed) next.add(key)
        else next.delete(key)
        return next
      })
    } catch (err) {
      console.error('[cadence] toggle failed, reverting', err)
      // Revert the optimistic change.
      setCompleted((prev) => {
        const next = new Set(prev)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      })
    }
  }, [])

  const todayDone = completed.has(today)

  const goToToday = useCallback(() => {
    const d = new Date()
    setView({ year: d.getFullYear(), month: d.getMonth() })
  }, [])

  const prevMonth = useCallback(() => {
    setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { ...v, month: v.month - 1 }))
  }, [])

  const nextMonth = useCallback(() => {
    setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { ...v, month: v.month + 1 }))
  }, [])

  // Don't let the user navigate past the current month — there's nothing to log.
  const canGoNext =
    view.year < now.getFullYear() ||
    (view.year === now.getFullYear() && view.month < now.getMonth())

  const viewingThisMonth = view.year === now.getFullYear() && view.month === now.getMonth()
  const monthCount = useMemo(
    () => countInMonth(completed, view.year, view.month),
    [completed, view.year, view.month]
  )

  return (
    <div className="app">
      <div className="titlebar-drag" />

      <header className="hero">
        <div className="hero__brand">
          <div className="hero__mark">
            <CheckIcon width={20} height={20} />
          </div>
          <div>
            <h1 className="hero__title">Cadence</h1>
            <p className="hero__tagline">Your training streak, one day at a time.</p>
          </div>
        </div>

        <div className="hero__actions">
          <button
            className={`today-btn${todayDone ? ' is-done' : ''}`}
            onClick={() => toggle(today)}
            disabled={loading}
          >
            <span className="today-btn__check">
              <CheckIcon width={18} height={18} />
            </span>
            {todayDone ? "Today's locked in" : 'Mark today complete'}
          </button>

          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? (
              <SunIcon width={20} height={20} />
            ) : (
              <MoonIcon width={20} height={20} />
            )}
          </button>
        </div>
      </header>

      <StatsBar stats={stats} monthCount={monthCount} monthLabel={MONTH_NAMES[view.month]} />

      <Calendar
        year={view.year}
        month={view.month}
        today={today}
        completed={completed}
        canGoNext={canGoNext}
        onPrev={prevMonth}
        onNext={nextMonth}
        onToggle={toggle}
      />

      <footer className="footer">
        {!viewingThisMonth && (
          <button className="link-btn" onClick={goToToday}>
            Jump to today
          </button>
        )}
        <span className="footer__hint">Click any past or present day to log a session.</span>
      </footer>
    </div>
  )
}
