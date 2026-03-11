import { NextResponse } from 'next/server'
import { z } from 'zod'
import { importBackup } from '@/lib/db'

const importSchema = z.object({
  version: z.number().int().positive(),
  todos: z
    .array(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        due_date: z.string().nullable().optional(),
        priority: z.string().optional(),
        is_recurring: z.boolean().optional(),
        recurrence_pattern: z.string().nullable().optional(),
        completed: z.boolean().optional(),
        created_at: z.string().optional(),
        updated_at: z.string().optional(),
      })
    )
    .optional(),
  tags: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        created_at: z.string().optional(),
        updated_at: z.string().optional(),
      })
    )
    .optional(),
  todo_tags: z
    .array(
      z.object({
        todo_id: z.string(),
        tag_id: z.string(),
      })
    )
    .optional(),
  subtasks: z
    .array(
      z.object({
        id: z.string(),
        todo_id: z.string(),
        title: z.string().optional(),
        completed: z.boolean().optional(),
        position: z.number().optional(),
        created_at: z.string().optional(),
        updated_at: z.string().optional(),
      })
    )
    .optional(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const parseResult = importSchema.safeParse(body)
  if (!parseResult.success) {
    return NextResponse.json(
      { success: false, error: parseResult.error.flatten().formErrors.join('; ') },
      { status: 400 }
    )
  }

  try {
    const result = importBackup(parseResult.data)
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 400 })
  }
}
