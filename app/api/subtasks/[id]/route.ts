import { NextResponse } from 'next/server'
import { getSubtaskById, updateSubtask, deleteSubtask } from '@/lib/db'
import { z } from 'zod'

const updateSubtaskSchema = z.object({
  title: z.string().trim().min(1).optional(),
  completed: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
})

export async function PUT(
  request: Request,
  context: { params: any }
) {
  const { id } = await context.params
  const existing = getSubtaskById(id)
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Subtask not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const parseResult = updateSubtaskSchema.safeParse(body)
  if (!parseResult.success) {
    return NextResponse.json(
      { success: false, error: parseResult.error.flatten().formErrors.join('; ') },
      { status: 400 }
    )
  }

  const updated = updateSubtask(id, parseResult.data)
  if (!updated) {
    return NextResponse.json({ success: false, error: 'Subtask not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(
  _request: Request,
  context: { params: any }
) {
  const { id } = await context.params
  const success = deleteSubtask(id)
  if (!success) {
    return NextResponse.json({ success: false, error: 'Subtask not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
