import { formatInTimeZone } from 'date-fns-tz'
import type { RecurrencePattern } from './db'
import { parseSingaporeLocalIso } from './timezone'

const SG_TZ = 'Asia/Singapore'

function daysInMonth(year: number, month1To12: number): number {
  return new Date(Date.UTC(year, month1To12, 0)).getUTCDate()
}

function toSgParts(utcIso: string): {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
} {
  const local = formatInTimeZone(new Date(utcIso), SG_TZ, "yyyy-MM-dd'T'HH:mm:ss")
  const [datePart, timePart] = local.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute, second] = timePart.split(':').map(Number)
  return { year, month, day, hour, minute, second }
}

function toUtcIsoFromSgParts(parts: {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  const localIso = `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}:${pad(parts.second)}`
  return parseSingaporeLocalIso(localIso).toISOString()
}

export function calculateNextDueDate(dueDateUtcIso: string, pattern: RecurrencePattern): string {
  const current = toSgParts(dueDateUtcIso)

  if (pattern === 'daily') {
    const temp = new Date(Date.UTC(current.year, current.month - 1, current.day, current.hour, current.minute, current.second))
    temp.setUTCDate(temp.getUTCDate() + 1)
    return toUtcIsoFromSgParts({
      year: temp.getUTCFullYear(),
      month: temp.getUTCMonth() + 1,
      day: temp.getUTCDate(),
      hour: temp.getUTCHours(),
      minute: temp.getUTCMinutes(),
      second: temp.getUTCSeconds(),
    })
  }

  if (pattern === 'weekly') {
    const temp = new Date(Date.UTC(current.year, current.month - 1, current.day, current.hour, current.minute, current.second))
    temp.setUTCDate(temp.getUTCDate() + 7)
    return toUtcIsoFromSgParts({
      year: temp.getUTCFullYear(),
      month: temp.getUTCMonth() + 1,
      day: temp.getUTCDate(),
      hour: temp.getUTCHours(),
      minute: temp.getUTCMinutes(),
      second: temp.getUTCSeconds(),
    })
  }

  if (pattern === 'monthly') {
    const monthIndex = current.month
    const targetYear = monthIndex === 12 ? current.year + 1 : current.year
    const targetMonth = monthIndex === 12 ? 1 : monthIndex + 1
    const targetDay = Math.min(current.day, daysInMonth(targetYear, targetMonth))

    return toUtcIsoFromSgParts({
      year: targetYear,
      month: targetMonth,
      day: targetDay,
      hour: current.hour,
      minute: current.minute,
      second: current.second,
    })
  }

  const targetYear = current.year + 1
  const targetDay = Math.min(current.day, daysInMonth(targetYear, current.month))

  return toUtcIsoFromSgParts({
    year: targetYear,
    month: current.month,
    day: targetDay,
    hour: current.hour,
    minute: current.minute,
    second: current.second,
  })
}
