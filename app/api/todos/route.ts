import { NextResponse } from 'next/server'
import { getAllTodos, createTodo } from '@/lib/db'
import { createTodoSchema } from '@/lib/validation'
import { parseSingaporeLocalIso } from '@/lib/timezone'

export async function GET() {
  const todos = getAllTodos()
  return NextResponse.json({ success: true, data: todos })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const parseResult = createTodoSchema.safeParse(body)
  if (!parseResult.success) {
    return NextResponse.json({ success: false, error: parseResult.error.flatten().formErrors.join('; ') }, { status: 400 })
  }

  const { title, due_date, priority, is_recurring, recurrence_pattern } = parseResult.data
  const dueDateIso = due_date ? parseSingaporeLocalIso(due_date).toISOString() : null
  const todo = createTodo({
    title,
    due_date: dueDateIso,
    priority,
    is_recurring: is_recurring ?? false,
    recurrence_pattern: is_recurring ? (recurrence_pattern ?? null) : null,
  })
  return NextResponse.json({ success: true, data: todo }, { status: 201 })
}
