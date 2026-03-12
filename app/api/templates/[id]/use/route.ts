import { NextResponse } from 'next/server'
import { getTemplateById, createTodo, createSubtask } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function POST(
  _request: Request,
  context: { params: any }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { id } = await context.params
  const template = getTemplateById(id)
  if (!template) {
    return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 })
  }

  let dueDate: string | null = null
  if (template.due_date_offset_days !== null) {
    const now = new Date()
    now.setDate(now.getDate() + template.due_date_offset_days)
    dueDate = now.toISOString()
  }

  const todo = createTodo({
    title: template.title_template,
    due_date: dueDate,
    priority: template.priority,
    is_recurring: template.is_recurring,
    recurrence_pattern: template.recurrence_pattern,
    reminder_minutes: template.reminder_minutes,
    user_id: session.userId,
  })

  if (template.subtasks_json) {
    try {
      const subtasks = JSON.parse(template.subtasks_json) as Array<{ title: string; position?: number }>
      subtasks.forEach((st, idx) => {
        if (st.title && typeof st.title === 'string') {
          createSubtask({
            todo_id: todo.id,
            title: st.title,
            position: st.position ?? idx,
          })
        }
      })
    } catch {
      // Invalid JSON in subtasks_json, skip subtask creation
    }
  }

  return NextResponse.json({ success: true, data: todo }, { status: 201 })
}
