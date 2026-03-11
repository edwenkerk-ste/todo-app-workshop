import { describe, it, expect } from 'vitest'
import { calculateNextDueDate } from '../lib/recurrence'

describe('Feature 03 recurrence due date calculations', () => {
  it('calculates next due date for daily recurrence', () => {
    const next = calculateNextDueDate('2026-03-11T02:00:00.000Z', 'daily')
    expect(next).toBe('2026-03-12T02:00:00.000Z')
  })

  it('calculates next due date for weekly recurrence', () => {
    const next = calculateNextDueDate('2026-03-11T02:00:00.000Z', 'weekly')
    expect(next).toBe('2026-03-18T02:00:00.000Z')
  })

  it('calculates next due date for monthly recurrence with same day', () => {
    const next = calculateNextDueDate('2026-03-11T02:00:00.000Z', 'monthly')
    expect(next).toBe('2026-04-11T02:00:00.000Z')
  })

  it('clamps monthly recurrence to month end when needed', () => {
    const next = calculateNextDueDate('2026-01-31T02:00:00.000Z', 'monthly')
    expect(next).toBe('2026-02-28T02:00:00.000Z')
  })

  it('calculates next due date for yearly recurrence', () => {
    const next = calculateNextDueDate('2026-03-11T02:00:00.000Z', 'yearly')
    expect(next).toBe('2027-03-11T02:00:00.000Z')
  })
})
