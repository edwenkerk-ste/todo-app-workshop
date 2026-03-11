import { NextResponse } from 'next/server'
import { getTodoById, updateTodo, deleteTodo } from '@/lib/db'
import { updateTodoSchema } from '@/lib/validation'
import { parseSingaporeLocalIso } from '@/lib/timezone'

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
  const body = await request.json().catch(() => ({}))
  const parseResult = updateTodoSchema.safeParse(body)
  if (!parseResult.success) {
    return NextResponse.json({ success: false, error: parseResult.error.flatten().formErrors.join('; ') }, { status: 400 })
  }

  const payload = { ...parseResult.data }
  if (payload.due_date) {
    payload.due_date = parseSingaporeLocalIso(payload.due_date).toISOString()
  }

  const updated = updateTodo(id, payload)
  if (!updated) {
    return NextResponse.json({ success: false, error: 'Todo not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true, data: updated })
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
