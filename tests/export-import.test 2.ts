import { describe, it, expect } from 'vitest'
import { GET as exportGET } from '../app/api/todos/export/route'
import { POST as importPOST } from '../app/api/todos/import/route'
import { createTodo, deleteTodo, getAllTodos } from '../lib/db'

describe('Feature 09 Export & Import', () => {
  it('exports todos with correct schema', async () => {
    const todo = createTodo({ title: 'Export test', due_date: null, priority: 'medium' })
    try {
      const response = await exportGET()
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.success).toBe(true)
      expect(body.data).toHaveProperty('version')
      expect(body.data).toHaveProperty('todos')
      expect(Array.isArray(body.data.todos)).toBe(true)
      expect(body.data.todos.some((t: any) => t.id === todo.id)).toBe(true)
      expect(Array.isArray(body.data.tags)).toBe(true)
      expect(Array.isArray(body.data.subtasks)).toBe(true)
      expect(Array.isArray(body.data.todo_tags)).toBe(true)
    } finally {
      deleteTodo(todo.id)
    }
  })

  it('imports todos and remaps ids', async () => {
    const original = createTodo({ title: 'Import test', due_date: null, priority: 'medium' })
    try {
      const exportRes = await exportGET()
      const exportBody = await exportRes.json()
      const exportedTodo = exportBody.data.todos.find((t: any) => t.id === original.id)
      expect(exportedTodo).toBeDefined()

      const importPayload = {
        version: exportBody.data.version,
        todos: [exportedTodo],
        tags: [],
        todo_tags: [],
        subtasks: [],
      }

      const request = new Request('http://localhost/api/todos/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(importPayload),
      })
      const response = await importPOST(request)
      const body = await response.json()
      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.data.imported.todos).toBe(1)

      const imported = getAllTodos().find((t) => t.title === original.title && t.id !== original.id)
      expect(imported).toBeDefined()
    } finally {
      // cleanup any todos created with this title
      getAllTodos().filter((t) => t.title === 'Import test').forEach((t) => deleteTodo(t.id))
    }
  })

  it('returns validation error for invalid JSON', async () => {
    const request = new Request('http://localhost/api/todos/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'this is not json',
    })
    const response = await importPOST(request)
    const body = await response.json()
    expect(response.status).toBe(400)
    expect(body.success).toBe(false)
    expect(typeof body.error).toBe('string')
  })
})
