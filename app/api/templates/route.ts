import { NextResponse } from 'next/server'
import { getAllTemplates, createTemplate } from '@/lib/db'
import type { Priority, RecurrencePattern } from '@/lib/db'

export async function GET() {
  const templates = getAllTemplates()
  return NextResponse.json({ success: true, data: templates })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const titleTemplate = typeof body.title_template === 'string' ? body.title_template.trim() : ''

  if (!name) {
    return NextResponse.json(
      { success: false, error: 'Template name is required' },
      { status: 400 }
    )
  }
  if (!titleTemplate) {
    return NextResponse.json(
      { success: false, error: 'Title template is required' },
      { status: 400 }
    )
  }

  const validPriorities: Priority[] = ['high', 'medium', 'low']
  const priority: Priority = validPriorities.includes(body.priority) ? body.priority : 'medium'

  const validPatterns: RecurrencePattern[] = ['daily', 'weekly', 'monthly', 'yearly']
  const isRecurring = Boolean(body.is_recurring)
  const recurrencePattern: RecurrencePattern | null = isRecurring && validPatterns.includes(body.recurrence_pattern)
    ? body.recurrence_pattern
    : null

  const reminderMinutes = typeof body.reminder_minutes === 'number' ? body.reminder_minutes : null
  const description = typeof body.description === 'string' ? body.description : null
  const category = typeof body.category === 'string' ? body.category : null

  let subtasksJson: string | null = null
  if (body.subtasks_json !== undefined && body.subtasks_json !== null) {
    if (typeof body.subtasks_json === 'string') {
      subtasksJson = body.subtasks_json
    } else if (Array.isArray(body.subtasks_json)) {
      subtasksJson = JSON.stringify(body.subtasks_json)
    }
  }

  const dueDateOffsetDays = typeof body.due_date_offset_days === 'number'
    ? body.due_date_offset_days
    : null

  const template = createTemplate({
    name,
    description,
    category,
    title_template: titleTemplate,
    priority,
    is_recurring: isRecurring,
    recurrence_pattern: recurrencePattern,
    reminder_minutes: reminderMinutes,
    subtasks_json: subtasksJson,
    due_date_offset_days: dueDateOffsetDays,
  })

  return NextResponse.json({ success: true, data: template }, { status: 201 })
}
