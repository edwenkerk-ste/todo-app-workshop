import { NextResponse } from 'next/server'
import { getTemplateById, updateTemplate, deleteTemplate } from '@/lib/db'
import type { Priority, RecurrencePattern } from '@/lib/db'

export async function GET(
  _request: Request,
  context: { params: any }
) {
  const { id } = await context.params
  const template = getTemplateById(id)
  if (!template) {
    return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true, data: template })
}

export async function PUT(
  request: Request,
  context: { params: any }
) {
  const { id } = await context.params
  const existing = getTemplateById(id)
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => ({}))

  const updates: Record<string, unknown> = {}

  if (body.name !== undefined) {
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Template name cannot be empty' },
        { status: 400 }
      )
    }
    updates.name = name
  }

  if (body.title_template !== undefined) {
    const title = typeof body.title_template === 'string' ? body.title_template.trim() : ''
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title template cannot be empty' },
        { status: 400 }
      )
    }
    updates.title_template = title
  }

  if (body.description !== undefined) {
    updates.description = typeof body.description === 'string' ? body.description : null
  }

  if (body.category !== undefined) {
    updates.category = typeof body.category === 'string' ? body.category : null
  }

  if (body.priority !== undefined) {
    const validPriorities: Priority[] = ['high', 'medium', 'low']
    updates.priority = validPriorities.includes(body.priority) ? body.priority : 'medium'
  }

  if (body.is_recurring !== undefined) {
    updates.is_recurring = Boolean(body.is_recurring)
  }

  if (body.recurrence_pattern !== undefined) {
    const validPatterns: RecurrencePattern[] = ['daily', 'weekly', 'monthly', 'yearly']
    updates.recurrence_pattern = validPatterns.includes(body.recurrence_pattern)
      ? body.recurrence_pattern
      : null
  }

  if (body.reminder_minutes !== undefined) {
    updates.reminder_minutes = typeof body.reminder_minutes === 'number' ? body.reminder_minutes : null
  }

  if (body.subtasks_json !== undefined) {
    if (body.subtasks_json === null) {
      updates.subtasks_json = null
    } else if (typeof body.subtasks_json === 'string') {
      updates.subtasks_json = body.subtasks_json
    } else if (Array.isArray(body.subtasks_json)) {
      updates.subtasks_json = JSON.stringify(body.subtasks_json)
    }
  }

  if (body.due_date_offset_days !== undefined) {
    updates.due_date_offset_days = typeof body.due_date_offset_days === 'number'
      ? body.due_date_offset_days
      : null
  }

  const updated = updateTemplate(id, updates as any)
  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(
  _request: Request,
  context: { params: any }
) {
  const { id } = await context.params
  const success = deleteTemplate(id)
  if (!success) {
    return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true })
}
