import { NextResponse } from 'next/server'
import { claimReminderNotification, getAllTodos } from '@/lib/db'
import { isReminderDue } from '@/lib/reminders'
import { getSession } from '@/lib/auth'

export async function GET(_request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })

  const nowIso = new Date().toISOString()
  const todos = getAllTodos(session.userId)

  const dueReminders = todos.filter((todo) => {
    if (todo.completed) return false
    if (!todo.due_date) return false
    if (todo.reminder_minutes === null || todo.reminder_minutes === undefined) return false

    return isReminderDue({
      dueDateIso: todo.due_date,
      reminderMinutes: todo.reminder_minutes,
      nowIso,
      lastNotificationSentIso: todo.last_notification_sent,
    })
  })

  const stamped = dueReminders
    .map((todo) => claimReminderNotification(todo.id, nowIso))
    .filter((todo): todo is NonNullable<typeof todo> => Boolean(todo))

  return NextResponse.json({ success: true, data: stamped }, { status: 200 })
}
