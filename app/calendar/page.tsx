'use client'

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSingaporeNow } from '@/lib/timezone'
import type { Priority } from '@/lib/db'

type Todo = {
  id: string
  title: string
  due_date: string | null
  priority: Priority
  completed: boolean
}

type Holiday = {
  id: string
  date: string
  name: string
  observed: boolean
}

type CalendarDay = {
  date: Date
  dateStr: string // YYYY-MM-DD
  isCurrentMonth: boolean
  isToday: boolean
  isWeekend: boolean
  todos: Todo[]
  holidays: Holiday[]
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const priorityColors: Record<Priority, string> = {
  high: '#ef4444',
  medium: '#eab308',
  low: '#3b82f6',
}

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function generateCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - startDate.getDay()) // back to Sunday

  const endDate = new Date(lastDay)
  const daysUntilSat = 6 - endDate.getDay()
  endDate.setDate(endDate.getDate() + daysUntilSat) // forward to Saturday

  const days: Date[] = []
  const cur = new Date(startDate)
  while (cur <= endDate) {
    days.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="container" style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Loading calendar…</div>}>
      <CalendarContent />
    </Suspense>
  )
}

function CalendarContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const now = getSingaporeNow()
  const todayStr = toDateStr(now)

  const initialMonth = useMemo(() => {
    const param = searchParams.get('month')
    if (param && /^\d{4}-\d{2}$/.test(param)) {
      const [y, m] = param.split('-').map(Number)
      if (y >= 1970 && y <= 2100 && m >= 1 && m <= 12) {
        return { year: y, month: m - 1 }
      }
    }
    return { year: now.getFullYear(), month: now.getMonth() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [year, setYear] = useState(initialMonth.year)
  const [month, setMonth] = useState(initialMonth.month)
  const [todos, setTodos] = useState<Todo[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Update URL when month changes
  useEffect(() => {
    const m = `${year}-${String(month + 1).padStart(2, '0')}`
    const current = searchParams.get('month')
    if (current !== m) {
      router.replace(`/calendar?month=${m}`, { scroll: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [todosRes, holidaysRes] = await Promise.all([
        fetch('/api/todos'),
        fetch(`/api/holidays?year=${year}&month=${month + 1}`),
      ])
      if (todosRes.ok) {
        const json = await todosRes.json()
        setTodos(json.data ?? json)
      }
      if (holidaysRes.ok) {
        const data = await holidaysRes.json()
        setHolidays(data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  // Build holiday map for current display
  const holidayMap = useMemo(() => {
    const map = new Map<string, Holiday[]>()
    for (const h of holidays) {
      const key = h.date
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(h)
    }
    return map
  }, [holidays])

  // Build todo map by due_date (date portion only)
  const todoMap = useMemo(() => {
    const map = new Map<string, Todo[]>()
    for (const t of todos) {
      if (!t.due_date) continue
      // Parse due_date which is ISO (e.g. "2026-03-11T10:00:00.000Z")
      // We need Singapore local date
      const d = new Date(t.due_date)
      // Convert to Singapore local date string
      const sgStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Singapore' }) // YYYY-MM-DD
      if (!map.has(sgStr)) map.set(sgStr, [])
      map.get(sgStr)!.push(t)
    }
    return map
  }, [todos])

  const calendarDays: CalendarDay[] = useMemo(() => {
    const rawDays = generateCalendarDays(year, month)
    return rawDays.map((d) => {
      const dateStr = toDateStr(d)
      const dayOfWeek = d.getDay()
      return {
        date: d,
        dateStr,
        isCurrentMonth: d.getMonth() === month,
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
        todos: todoMap.get(dateStr) ?? [],
        holidays: holidayMap.get(dateStr) ?? [],
      }
    })
  }, [year, month, todayStr, todoMap, holidayMap])

  const weeks = useMemo(() => {
    const result: CalendarDay[][] = []
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7))
    }
    return result
  }, [calendarDays])

  const goToPrevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const goToNextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else {
      setMonth((m) => m + 1)
    }
  }

  const goToToday = () => {
    const n = getSingaporeNow()
    setYear(n.getFullYear())
    setMonth(n.getMonth())
  }

  // Selected day data
  const selectedDayData = useMemo(() => {
    if (!selectedDay) return null
    return calendarDays.find((d) => d.dateStr === selectedDay) ?? null
  }, [selectedDay, calendarDays])

  return (
    <main className="container" style={{ maxWidth: 1100 }}>
      {/* Navigation */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a
            href="/"
            className="small-btn"
            style={{ textDecoration: 'none' }}
            aria-label="Back to todo list"
          >
            ← Back
          </a>
          <h1 style={{ margin: 0, fontSize: '1.75rem' }}>📅 Calendar</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="small-btn" onClick={goToPrevMonth} aria-label="Previous month">◀</button>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', minWidth: 160, textAlign: 'center' }}>
            {MONTH_NAMES[month]} {year}
          </span>
          <button className="small-btn" onClick={goToNextMonth} aria-label="Next month">▶</button>
          <button className="small-btn" onClick={goToToday} aria-label="Go to today" style={{ marginLeft: '0.25rem' }}>
            Today
          </button>
        </div>
      </header>

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>Loading…</div>
      )}

      {!loading && (
        <div className="calendar-grid" role="grid" aria-label="Calendar">
          {/* Day headers */}
          <div className="calendar-header-row" role="row">
            {DAY_NAMES.map((name) => (
              <div key={name} className="calendar-day-header" role="columnheader">
                {name}
              </div>
            ))}
          </div>

          {/* Weeks */}
          {weeks.map((week, wi) => (
            <div key={wi} className="calendar-week-row" role="row">
              {week.map((day) => {
                const totalItems = day.todos.length + day.holidays.length
                return (
                  <button
                    key={day.dateStr}
                    role="gridcell"
                    aria-label={`${day.dateStr}${day.holidays.length > 0 ? `, Holiday: ${day.holidays.map((h) => h.name).join(', ')}` : ''}${day.todos.length > 0 ? `, ${day.todos.length} todo${day.todos.length > 1 ? 's' : ''}` : ''}`}
                    className={[
                      'calendar-day-cell',
                      !day.isCurrentMonth && 'calendar-day--other',
                      day.isToday && 'calendar-day--today',
                      day.isWeekend && 'calendar-day--weekend',
                      day.holidays.length > 0 && 'calendar-day--holiday',
                    ].filter(Boolean).join(' ')}
                    onClick={() => setSelectedDay(day.dateStr)}
                    tabIndex={0}
                  >
                    <span className="calendar-day-number">{day.date.getDate()}</span>
                    {day.holidays.length > 0 && (
                      <div className="calendar-holiday-list">
                        {day.holidays.map((h) => (
                          <span key={h.id} className="calendar-holiday-label" title={h.name}>
                            🏴 {h.name}
                          </span>
                        ))}
                      </div>
                    )}
                    {day.todos.length > 0 && (
                      <div className="calendar-todo-list">
                        {day.todos.slice(0, 3).map((t) => (
                          <span
                            key={t.id}
                            className="calendar-todo-label"
                            style={{
                              borderLeftColor: priorityColors[t.priority] ?? '#6b7280',
                              textDecoration: t.completed ? 'line-through' : undefined,
                              opacity: t.completed ? 0.5 : 1,
                            }}
                            title={t.title}
                          >
                            {t.title}
                          </span>
                        ))}
                        {day.todos.length > 3 && (
                          <span className="calendar-todo-more">+{day.todos.length - 3} more</span>
                        )}
                      </div>
                    )}
                    {totalItems > 0 && (
                      <span className="calendar-badge">{totalItems}</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Day modal */}
      {selectedDay && selectedDayData && (
        <div className="modal-backdrop" onClick={() => setSelectedDay(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ fontSize: '1.1rem' }}>
                {new Date(selectedDayData.dateStr + 'T00:00:00').toLocaleDateString('en-SG', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h2>
              <button className="close-button" onClick={() => setSelectedDay(null)} aria-label="Close">✕</button>
            </div>

            {selectedDayData.holidays.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>Holidays</h3>
                {selectedDayData.holidays.map((h) => (
                  <div key={h.id} style={{ padding: '0.4rem 0.6rem', background: 'rgba(239,68,68,0.1)', borderRadius: 8, marginBottom: '0.3rem', fontSize: '0.9rem' }}>
                    🏴 {h.name}
                  </div>
                ))}
              </div>
            )}

            <div>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                Todos ({selectedDayData.todos.length})
              </h3>
              {selectedDayData.todos.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No todos for this day.</p>
              ) : (
                selectedDayData.todos.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 0.6rem',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 8,
                      marginBottom: '0.3rem',
                      borderLeft: `3px solid ${priorityColors[t.priority] ?? '#6b7280'}`,
                    }}
                  >
                    <span style={{
                      textDecoration: t.completed ? 'line-through' : undefined,
                      opacity: t.completed ? 0.5 : 1,
                      fontSize: '0.9rem',
                      flex: 1,
                    }}>
                      {t.title}
                    </span>
                    <span className={`badge badge--${t.priority}`} style={{ fontSize: '0.7rem' }}>
                      {t.priority}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
