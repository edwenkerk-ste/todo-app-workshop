import { describe, it, expect } from 'vitest'
import { POST } from '../app/api/todos/route'
import { createTodo, deleteTodo, getAllTodos, getTodoById, Priority } from '../lib/db'
import { prioritySchema } from '../lib/validation'
import { filterTodosByPriority } from '@/lib/priority'

describe('Feature 02 Priority System', () => {
  it('defaults to medium when priority is omitted in API create payload', async () => {
    let createdId: string | null = null
    try {
      const request = new Request('http://localhost/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Priority default API test' }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)

      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data.priority).toBe('medium')
      createdId = body.data.id as string

      const persisted = getTodoById(createdId)
      expect(persisted?.priority).toBe('medium')
    } finally {
      if (createdId) {
        deleteTodo(createdId)
      }
    }
  })

  it('rejects invalid priority enum values', async () => {
    const parse = prioritySchema.safeParse('urgent')
    expect(parse.success).toBe(false)

    const request = new Request('http://localhost/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Bad priority', priority: 'urgent' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.success).toBe(false)
    expect(typeof body.error).toBe('string')
    expect(body.error.length).toBeGreaterThan(0)
  })

  it('sorts todos by priority high > medium > low', () => {
    const created: string[] = []
    try {
      const low = createTodo({ title: 'Priority sort low', due_date: null, priority: 'low' })
      const medium = createTodo({ title: 'Priority sort medium', due_date: null, priority: 'medium' })
      const high = createTodo({ title: 'Priority sort high', due_date: null, priority: 'high' })

      created.push(low.id, medium.id, high.id)

      const expectedOrder: Priority[] = ['high', 'medium', 'low']

      const prioritiesInApiOrder = getAllTodos()
        .filter((todo) => created.includes(todo.id))
        .map((todo) => todo.priority)

      expect(prioritiesInApiOrder).toEqual(expectedOrder)
    } finally {
      created.forEach((id) => deleteTodo(id))
    }
  })

  it('filters todos by selected priority', () => {
    const todos: Array<{ id: string; priority: Priority }> = [
      { id: '1', priority: 'high' },
      { id: '2', priority: 'medium' },
      { id: '3', priority: 'low' },
      { id: '4', priority: 'high' },
    ]

    const highOnly = filterTodosByPriority(todos, 'high')
    expect(highOnly.map((t: { id: string }) => t.id)).toEqual(['1', '4'])

    const mediumOnly = filterTodosByPriority(todos, 'medium')
    expect(mediumOnly.map((t: { id: string }) => t.id)).toEqual(['2'])

    const all = filterTodosByPriority(todos, 'all')
    expect(all.map((t: { id: string }) => t.id)).toEqual(['1', '2', '3', '4'])
  })
})
