import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSubtaskById, updateSubtask, deleteSubtask } from '@/lib/db'
import { getSession } from '@/lib/auth'

const updateSubtaskSchema = z.object({
  title: z.string().trim().min(1).optional(),
  completed: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
})

export async function PUT(
  request: Request,
  context: { params: any }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { id } = await context.params
  const existing = getSubtaskById(id)
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Subtask not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = updateSubtaskSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const updated = updateSubtask(id, parsed.data)
  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(
  _request: Request,
  context: { params: any }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { id } = await context.params
  const deleted = deleteSubtask(id)
  if (!deleted) {
    return NextResponse.json({ success: false, error: 'Subtask not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
