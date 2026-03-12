import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getTodoById, getSubtasksByTodoId, createSubtask } from '@/lib/db'
import { getSession } from '@/lib/auth'

const createSubtaskSchema = z.object({
  title: z.string().trim().min(1, { message: 'Subtask title is required' }),
})

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { id } = await context.params
  const todo = getTodoById(id)
  if (!todo) {
    return NextResponse.json({ success: false, error: 'Todo not found' }, { status: 404 })
  }
  const subtasks = getSubtasksByTodoId(id)
  return NextResponse.json({ success: true, data: subtasks })
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { id } = await context.params
  const todo = getTodoById(id)
  if (!todo) {
    return NextResponse.json({ success: false, error: 'Todo not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = createSubtaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const subtask = createSubtask({ todo_id: id, title: parsed.data.title })
  return NextResponse.json({ success: true, data: subtask }, { status: 201 })
}
