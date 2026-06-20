import { buildMonthGrid, MONTH_NAMES, WEEKDAYS } from '../lib/calendar'
import { CheckIcon, ChevronLeft, ChevronRight } from './icons'

interface CalendarProps {
  year: number
  month: number
  /** Today's key (`YYYY-MM-DD`), owned by App so it refreshes across midnight. */
  today: string
  completed: Set<string>
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
  onToggle: (key: string) => void
}

export default function Calendar({
  year,
  month,
  today,
  completed,
  canGoNext,
  onPrev,
  onNext,
  onToggle
}: CalendarProps) {
  const cells = buildMonthGrid(year, month)

  return (
    <section className="calendar" aria-label="Training calendar">
      <header className="calendar__head">
        <button className="nav-btn" onClick={onPrev} aria-label="Previous month">
          <ChevronLeft width={20} height={20} />
        </button>
        <h2 className="calendar__title">
          {MONTH_NAMES[month]} <span>{year}</span>
        </h2>
        <button
          className="nav-btn"
          onClick={onNext}
          disabled={!canGoNext}
          aria-label="Next month"
        >
          <ChevronRight width={20} height={20} />
        </button>
      </header>

      <div className="weekdays">
        {WEEKDAYS.map((d) => (
          <div key={d} className="weekdays__cell">
            {d}
          </div>
        ))}
      </div>

      <div className="grid">
        {cells.map((cell, i) => {
          if (cell.key === null) {
            return <div key={`pad-${i}`} className="day day--pad" aria-hidden="true" />
          }
          const done = completed.has(cell.key)
          // ISO keys sort lexicographically, so a plain string compare is a
          // correct "is this after today?" check.
          const future = cell.key > today
          const isToday = cell.key === today

          const cls = [
            'day',
            done && 'day--done',
            future && 'day--future',
            isToday && 'day--today'
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <button
              key={cell.key}
              className={cls}
              disabled={future}
              onClick={() => onToggle(cell.key!)}
              aria-pressed={done}
              aria-label={`${MONTH_NAMES[month]} ${cell.day}${done ? ', completed' : ''}`}
            >
              <span className="day__num">{cell.day}</span>
              <span className="day__check">
                <CheckIcon width={18} height={18} />
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
