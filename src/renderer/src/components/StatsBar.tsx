import { useEffect, useRef, useState } from 'react'
import type { Stats } from '../../../shared/types'
import { CalendarIcon, FlameIcon, TrophyIcon } from './icons'

interface StatsBarProps {
  stats: Stats
  monthCount: number
  monthLabel: string
}

/** A single stat tile. Pulses briefly when its value increases. */
function StatTile({
  label,
  value,
  suffix,
  icon,
  accent
}: {
  label: string
  value: number
  suffix?: string
  icon: React.ReactNode
  accent?: boolean
}) {
  const [bump, setBump] = useState(false)
  const prev = useRef(value)
  const mounted = useRef(false)

  useEffect(() => {
    // Only celebrate genuine increments — not the initial hydration from the DB
    // (0 → real value), which isn't a user action.
    if (mounted.current && value > prev.current) {
      setBump(true)
      const t = setTimeout(() => setBump(false), 600)
      prev.current = value
      return () => clearTimeout(t)
    }
    prev.current = value
    mounted.current = true
    return undefined
  }, [value])

  return (
    <div className={`stat-tile${accent ? ' stat-tile--accent' : ''}`}>
      <div className="stat-tile__icon">{icon}</div>
      <div className="stat-tile__body">
        <div className={`stat-tile__value${bump ? ' is-bumping' : ''}`}>
          {value}
          {suffix && <span className="stat-tile__suffix">{suffix}</span>}
        </div>
        <div className="stat-tile__label">{label}</div>
      </div>
    </div>
  )
}

export default function StatsBar({ stats, monthCount, monthLabel }: StatsBarProps) {
  return (
    <section className="stats" aria-label="Training stats">
      <StatTile
        label="Current streak"
        value={stats.currentStreak}
        suffix={stats.currentStreak === 1 ? 'day' : 'days'}
        icon={<FlameIcon width={22} height={22} />}
        accent
      />
      <StatTile
        label="Longest streak"
        value={stats.longestStreak}
        suffix={stats.longestStreak === 1 ? 'day' : 'days'}
        icon={<TrophyIcon width={22} height={22} />}
      />
      <StatTile
        label={`In ${monthLabel}`}
        value={monthCount}
        suffix="days"
        icon={<CalendarIcon width={22} height={22} />}
      />
      <StatTile
        label="Total logged"
        value={stats.totalDays}
        suffix="days"
        icon={<CheckBadge />}
      />
    </section>
  )
}

function CheckBadge() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width={22} height={22} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8.5 12l2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
