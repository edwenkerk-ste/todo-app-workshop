import type { Page } from '@playwright/test'

const E2E_USER = 'e2e-user'

/** Seed a session for E2E by calling the test-only session API. Use before visiting protected routes. */
export async function seedSession(page: Page, username: string = E2E_USER): Promise<void> {
  const res = await page.request.post('/api/test/session', {
    data: { username },
  })
  if (!res.ok()) {
    throw new Error(`seedSession failed: ${res.status()} ${await res.text()}`)
  }
}

/** Clear all todos for the current user via API. */
export async function clearAllTodos(page: Page): Promise<void> {
  const res = await page.request.get('/api/todos')
  const body = await res.json()
  if (body?.success && Array.isArray(body.data)) {
    for (const todo of body.data) {
      await page.request.delete(`/api/todos/${todo.id}`)
    }
  }
}

export interface CreateTodoOptions {
  title: string
  priority?: 'high' | 'medium' | 'low'
  due_date?: string | null
  is_recurring?: boolean
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null
  reminder_minutes?: number | null
  tag_ids?: string[]
}

/** Create a todo via API. Returns the created todo id from response. */
export async function createTodo(
  page: Page,
  options: CreateTodoOptions
): Promise<{ id: string }> {
  const { title, priority = 'medium', due_date = null, is_recurring = false, recurrence_pattern = null, reminder_minutes = null, tag_ids } = options
  const res = await page.request.post('/api/todos', {
    data: {
      title,
      priority,
      due_date,
      is_recurring,
      recurrence_pattern: is_recurring ? recurrence_pattern : null,
      reminder_minutes: due_date ? reminder_minutes : null,
      tag_ids: tag_ids ?? [],
    },
  })
  if (!res.ok()) {
    throw new Error(`createTodo failed: ${res.status()} ${await res.text()}`)
  }
  const body = await res.json()
  if (!body?.success || !body?.data?.id) {
    throw new Error(`createTodo invalid response: ${JSON.stringify(body)}`)
  }
  return { id: body.data.id }
}

/** Add a subtask to a todo via API. */
export async function addSubtask(
  page: Page,
  todoId: string,
  title: string,
  position?: number
): Promise<{ id: string }> {
  const res = await page.request.post(`/api/todos/${todoId}/subtasks`, {
    data: { title, position: position ?? 0 },
  })
  if (!res.ok()) {
    throw new Error(`addSubtask failed: ${res.status()} ${await res.text()}`)
  }
  const body = await res.json()
  if (!body?.success || !body?.data?.id) {
    throw new Error(`addSubtask invalid response: ${JSON.stringify(body)}`)
  }
  return { id: body.data.id }
}

export interface CreateTagOptions {
  name: string
  color?: string
}

/** Create a tag via API. */
export async function createTag(page: Page, options: CreateTagOptions): Promise<{ id: string }> {
  const { name, color = '#6b7280' } = options
  const res = await page.request.post('/api/tags', {
    data: { name, color },
  })
  if (!res.ok()) {
    throw new Error(`createTag failed: ${res.status()} ${await res.text()}`)
  }
  const body = await res.json()
  if (!body?.success || !body?.data?.id) {
    throw new Error(`createTag invalid response: ${JSON.stringify(body)}`)
  }
  return { id: body.data.id }
}

/** Get future due date for API (Singapore local format YYYY-MM-DDTHH:mm). Use a fixed future date so it works in any TZ. */
export function futureDueDateLocal(minutesFromNow: number = 60): string {
  const d = new Date(Date.now() + minutesFromNow * 60 * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
}

/** A fixed future date in Singapore local format for recurring/reminder tests. */
export const FIXED_FUTURE_DUE = '2027-06-15T10:00'

/** A fixed past date for validation tests (must be in the past in Singapore). */
export const FIXED_PAST_DUE = '2020-01-01T00:00'
