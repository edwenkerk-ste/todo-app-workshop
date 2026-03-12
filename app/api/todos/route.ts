import { NextResponse } from 'next/server'
import { getAllTodos, createTodo, getTagsForTodo, setTodoTags, getTagById } from '@/lib/db'
import { createTodoSchema } from '@/lib/validation'
import { parseSingaporeLocalIso } from '@/lib/timezone'
import { getSession } from '@/lib/auth'
import { checkRateLimit, RATE_LIMITS } from '@/lib/ratelimit'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })

    const todos = getAllTodos(session.userId)
    const todosWithTags = todos.map((todo) => ({
      ...todo,
      tags: getTagsForTodo(todo.id),
    }))
    return NextResponse.json({ success: true, data: todosWithTags })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to load todos.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })

    // Rate limiting per user
    const { success: limitOk } = checkRateLimit(`todo-create-${session.userId}`, RATE_LIMITS.todos.maxRequests, RATE_LIMITS.todos.windowMs)
    if (!limitOk) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const parseResult = createTodoSchema.safeParse(body)
    if (!parseResult.success) {
      const message = parseResult.error.issues.map((e) => e.message).filter(Boolean).join('; ')
      return NextResponse.json({ success: false, error: message || 'Invalid todo payload' }, { status: 400 })
    }

    const { title, due_date, priority, is_recurring, recurrence_pattern, reminder_minutes, tag_ids } = parseResult.data
    const dueDateIso = due_date ? parseSingaporeLocalIso(due_date).toISOString() : null
    const todo = createTodo({
      title,
      due_date: dueDateIso,
      priority,
      is_recurring: is_recurring ?? false,
      recurrence_pattern: is_recurring ? (recurrence_pattern ?? null) : null,
      reminder_minutes: dueDateIso ? (reminder_minutes ?? null) : null,
      last_notification_sent: null,
      user_id: session.userId,
    })
    if (tag_ids?.length) {
      const validIds = tag_ids.filter((id) => getTagById(id))
      setTodoTags(todo.id, validIds)
    }
    const tags = getTagsForTodo(todo.id)
    return NextResponse.json({ success: true, data: { ...todo, tags } }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to create todo. Please try again.' }, { status: 500 })
  }
}
