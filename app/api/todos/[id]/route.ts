import { NextResponse } from 'next/server'
import { getTodoById, updateTodo, deleteTodo, createTodo } from '@/lib/db'
import { updateTodoSchema } from '@/lib/validation'
import { parseSingaporeLocalIso } from '@/lib/timezone'
import { calculateNextDueDate } from '@/lib/recurrence'

export async function GET(
  _request: Request,
  context: { params: any }
) {
  const { id } = await context.params
  const todo = getTodoById(id)
  if (!todo) {
    return NextResponse.json({ success: false, error: 'Todo not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true, data: todo })
}

export async function PUT(
  request: Request,
  context: { params: any }
) {
  const { id } = await context.params
  const existing = getTodoById(id)
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Todo not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const parseResult = updateTodoSchema.safeParse(body)
  if (!parseResult.success) {
    return NextResponse.json({ success: false, error: parseResult.error.flatten().formErrors.join('; ') }, { status: 400 })
  }

  const parsed = { ...parseResult.data }
  if (parsed.due_date) {
    parsed.due_date = parseSingaporeLocalIso(parsed.due_date).toISOString()
  }

  const effectiveDueDate = parsed.due_date !== undefined ? parsed.due_date : existing.due_date
  if (parsed.reminder_minutes !== undefined && parsed.reminder_minutes !== null && !effectiveDueDate) {
    return NextResponse.json({ success: false, error: 'Reminder requires a due date' }, { status: 400 })
  }

  if (parsed.is_recurring === false) {
    parsed.recurrence_pattern = null
  }

  if (parsed.due_date === null) {
    parsed.reminder_minutes = null
  }

  const reminderConfigChanged =
    (parsed.due_date !== undefined && parsed.due_date !== existing.due_date) ||
    (parsed.reminder_minutes !== undefined && parsed.reminder_minutes !== existing.reminder_minutes)

  const updatePayload: Record<string, unknown> = { ...parsed }
  if (reminderConfigChanged) {
    updatePayload.last_notification_sent = null
  }

  const shouldCreateNextInstance =
    parsed.completed === true &&
    existing.completed === false &&
    existing.is_recurring &&
    Boolean(existing.recurrence_pattern) &&
    Boolean(existing.due_date)

  const updated = updateTodo(id, updatePayload as any)
  if (!updated) {
    return NextResponse.json({ success: false, error: 'Todo not found' }, { status: 404 })
  }

  let createdRecurringTodo = null
  if (shouldCreateNextInstance && existing.due_date && existing.recurrence_pattern) {
    const nextDueDate = calculateNextDueDate(existing.due_date, existing.recurrence_pattern)
    createdRecurringTodo = createTodo({
      title: existing.title,
      due_date: nextDueDate,
      priority: existing.priority,
      is_recurring: true,
      recurrence_pattern: existing.recurrence_pattern,
      reminder_minutes: existing.reminder_minutes,
      last_notification_sent: null,
    })
  }

  return NextResponse.json({
    success: true,
    data: updated,
    created_recurring_todo: createdRecurringTodo,
  })
}

export async function DELETE(
  _request: Request,
  context: { params: any }
) {
  const { id } = await context.params
  const success = deleteTodo(id)
  if (!success) {
    return NextResponse.json({ success: false, error: 'Todo not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
