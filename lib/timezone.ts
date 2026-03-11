import { parseISO } from 'date-fns'
import { fromZonedTime, formatInTimeZone, toZonedTime } from 'date-fns-tz'

const SG_TZ = 'Asia/Singapore'

/**
 * Returns the current date/time expressed in Singapore timezone (same instant).
 */
export function getSingaporeNow(): Date {
  return toZonedTime(new Date(), SG_TZ)
}

/**
 * Parse an ISO string as if it were Singapore local time and return a UTC Date.
 * This allows clients to send a local date/time string (e.g. 2026-03-11T15:00) and
 * treat it as Asia/Singapore.
 */
export function parseSingaporeLocalIso(value: string): Date {
  const parsed = parseISO(value)
  // `fromZonedTime` treats the input as a local time in the given zone.
  return fromZonedTime(parsed, SG_TZ)
}

/**
 * Format a Date in Singapore timezone as a human-readable string.
 */
export function formatSingaporeDate(date: Date): string {
  return formatInTimeZone(date, SG_TZ, 'yyyy-MM-dd HH:mm')
}

/**
 * Format a Date in Singapore timezone for a `datetime-local` input.
 */
export function formatSingaporeForInput(date: Date): string {
  return formatInTimeZone(date, SG_TZ, "yyyy-MM-dd'T'HH:mm")
}

/**
 * Return true if the given Singapore-local iso string is at least `minMinutes` in the future
 * relative to now in Singapore.
 */
export function isFutureSingaporeIso(value: string, minMinutes = 1): boolean {
  try {
    const dueUtc = parseSingaporeLocalIso(value)
    const nowUtc = new Date()
    return dueUtc.getTime() >= nowUtc.getTime() + minMinutes * 60_000
  } catch {
    return false
  }
}
