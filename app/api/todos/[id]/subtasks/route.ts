import { NextResponse } from 'next/server'
import { getTodoById, createSubtask, getSubtasksByTodoId } from '@/lib/db'
import { z } from 'zod'

const createSubtaskSchema = z.object({
  title: z.string().trim().min(1, { message: 'Subtask title is required' }),
})

export async function GET(
  _request: Request,
  context: { params: any }
) {
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
  context: { params: any }
) {
  const { id } = await context.params
  const todo = getTodoById(id)
  if (!todo) {
    return NextResponse.json({ success: false, error: 'Todo not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const parseResult = createSubtaskSchema.safeParse(body)
  if (!parseResult.success) {
    return NextResponse.json(
      { success: false, error: parseResult.error.flatten().formErrors.join('; ') },
      { status: 400 }
    )
  }

  const subtask = createSubtask({ todo_id: id, title: parseResult.data.title })
  return NextResponse.json({ success: true, data: subtask }, { status: 201 })
}
