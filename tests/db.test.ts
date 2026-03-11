import { describe, it, expect } from 'vitest'
import { createTodo, getTodoById, updateTodo, deleteTodo } from '../lib/db'
import { isFutureSingaporeIso } from '../lib/timezone'

describe('Todo CRUD (Feature 01)', () => {
  it('validates Singapore timezone due dates correctly', () => {
    // Choose a date far in the future to ensure it's valid
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24)
    const iso = future.toISOString().slice(0, 16)

    expect(isFutureSingaporeIso(iso)).toBe(true)

    const past = new Date(Date.now() - 1000 * 60 * 60 * 24)
    const pastIso = past.toISOString().slice(0, 16)
    expect(isFutureSingaporeIso(pastIso)).toBe(false)
  })

  it('creates, retrieves, updates, and deletes a todo', () => {
    const todo = createTodo({
      title: 'Test todo',
      due_date: null,
      priority: 'medium',
    })

    expect(todo.id).toBeDefined()
    expect(todo.title).toBe('Test todo')
    expect(todo.completed).toBe(false)

    const fetched = getTodoById(todo.id)
    expect(fetched).not.toBeNull()
    expect(fetched?.title).toBe('Test todo')

    const updated = updateTodo(todo.id, { title: 'Updated', completed: true })
    expect(updated).not.toBeNull()
    expect(updated?.title).toBe('Updated')
    expect(updated?.completed).toBe(true)

    const removed = deleteTodo(todo.id)
    expect(removed).toBe(true)

    const missing = getTodoById(todo.id)
    expect(missing).toBeNull()
  })
})
