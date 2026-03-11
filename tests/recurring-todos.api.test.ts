import { describe, it, expect } from 'vitest'
import { POST } from '../app/api/todos/route'
import { PUT } from '../app/api/todos/[id]/route'
import { deleteTodo, getAllTodos, getTodoById } from '../lib/db'
import { parseSingaporeLocalIso } from '../lib/timezone'
import { calculateNextDueDate } from '../lib/recurrence'

describe('Feature 03 recurring todos API', () => {
  it('creates a daily recurring todo', async () => {
    let createdId: string | null = null
    try {
      const dueLocal = '2026-12-01T09:30'
      const expectedDueIso = parseSingaporeLocalIso(dueLocal).toISOString()

      const request = new Request('http://localhost/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Daily recurring test',
          due_date: dueLocal,
          priority: 'high',
          is_recurring: true,
          recurrence_pattern: 'daily',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.is_recurring).toBe(true)
      expect(body.data.recurrence_pattern).toBe('daily')
      expect(body.data.due_date).toBe(expectedDueIso)

      createdId = body.data.id as string
      const persisted = getTodoById(createdId)
      expect(persisted?.is_recurring).toBe(true)
      expect(persisted?.recurrence_pattern).toBe('daily')
    } finally {
      if (createdId) deleteTodo(createdId)
    }
  })

  it('creates a weekly recurring todo', async () => {
    let createdId: string | null = null
    try {
      const request = new Request('http://localhost/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Weekly recurring test',
          due_date: '2026-12-02T10:00',
          priority: 'medium',
          is_recurring: true,
          recurrence_pattern: 'weekly',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.is_recurring).toBe(true)
      expect(body.data.recurrence_pattern).toBe('weekly')

      createdId = body.data.id as string
    } finally {
      if (createdId) deleteTodo(createdId)
    }
  })

  it('completing recurring todo creates next instance with inherited metadata', async () => {
    const cleanupIds: string[] = []
    try {
      const dueLocal = '2026-12-03T08:00'
      const initialDueIso = parseSingaporeLocalIso(dueLocal).toISOString()

      const createReq = new Request('http://localhost/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Recurring completion test',
          due_date: dueLocal,
          priority: 'high',
          is_recurring: true,
          recurrence_pattern: 'weekly',
        }),
      })

      const createRes = await POST(createReq)
      expect(createRes.status).toBe(201)
      const created = await createRes.json()
      const originalId = created.data.id as string
      cleanupIds.push(originalId)

      const completeReq = new Request(`http://localhost/api/todos/${originalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })

      const completeRes = await PUT(completeReq, { params: Promise.resolve({ id: originalId }) })
      expect(completeRes.status).toBe(200)
      const completedBody = await completeRes.json()
      expect(completedBody.success).toBe(true)
      expect(completedBody.data.completed).toBe(true)
      expect(completedBody.created_recurring_todo).toBeTruthy()

      const related = getAllTodos().filter((t) => t.title === 'Recurring completion test')
      expect(related).toHaveLength(2)

      const original = related.find((t) => t.id === originalId)
      const next = related.find((t) => t.id !== originalId)

      expect(original?.completed).toBe(true)
      expect(next?.completed).toBe(false)
      expect(next?.id).not.toBe(originalId)
      expect(next?.due_date).toBe(calculateNextDueDate(initialDueIso, 'weekly'))
      expect(next?.priority).toBe('high')
      expect(next?.is_recurring).toBe(true)
      expect(next?.recurrence_pattern).toBe('weekly')

      if (next?.id) cleanupIds.push(next.id)
    } finally {
      cleanupIds.forEach((id) => deleteTodo(id))
    }
  })

  it('disables recurring on existing todo and does not create next instance on completion', async () => {
    let createdId: string | null = null
    try {
      const createReq = new Request('http://localhost/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Disable recurring test',
          due_date: '2026-12-04T08:00',
          is_recurring: true,
          recurrence_pattern: 'daily',
        }),
      })

      const createRes = await POST(createReq)
      const created = await createRes.json()
      createdId = created.data.id as string

      const disableReq = new Request(`http://localhost/api/todos/${createdId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_recurring: false,
          recurrence_pattern: null,
        }),
      })

      const disableRes = await PUT(disableReq, { params: Promise.resolve({ id: createdId }) })
      expect(disableRes.status).toBe(200)
      const disabledBody = await disableRes.json()
      expect(disabledBody.data.is_recurring).toBe(false)
      expect(disabledBody.data.recurrence_pattern).toBeNull()

      const completeReq = new Request(`http://localhost/api/todos/${createdId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })

      const completeRes = await PUT(completeReq, { params: Promise.resolve({ id: createdId }) })
      expect(completeRes.status).toBe(200)
      const completeBody = await completeRes.json()
      expect(completeBody.created_recurring_todo).toBeNull()

      const related = getAllTodos().filter((t) => t.title === 'Disable recurring test')
      expect(related).toHaveLength(1)
      expect(related[0].id).toBe(createdId)
      expect(related[0].completed).toBe(true)
    } finally {
      if (createdId) deleteTodo(createdId)
    }
  })
})
