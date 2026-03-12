import { test, expect } from '@playwright/test'
import { seedSession, clearAllTodos, createTodo, FIXED_FUTURE_DUE } from '../helpers'

test.describe('Reminders & Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page)
    await page.goto('/')
    await clearAllTodos(page)
  })

  test('Set reminder on todo', async ({ page }) => {
    const due = FIXED_FUTURE_DUE
    await page.getByRole('button', { name: 'New todo' }).click()
    await page.getByPlaceholder('What needs to be done?').fill('Todo with reminder')
    await page.getByLabel('Due date').fill(due)
    await page.getByLabel('Reminder').selectOption('60')
    await page.getByRole('button', { name: 'Add todo' }).click()
    await expect(page.locator('.todo-item__title', { hasText: 'Todo with reminder' })).toBeVisible()
    await expect(page.locator('text=🔔 1h')).toBeVisible()
  })

  test('Reminder badge displays correctly', async ({ page }) => {
    const due = FIXED_FUTURE_DUE
    await createTodo(page, {
      title: 'Badge reminder',
      due_date: due,
      reminder_minutes: 30,
    })
    await page.goto('/')
    await expect(page.locator('.todo-item').filter({ hasText: 'Badge reminder' }).locator('text=🔔 30m')).toBeVisible()
  })

  test('API returns todos needing notification', async ({ page }) => {
    const due = FIXED_FUTURE_DUE
    await createTodo(page, {
      title: 'Notify me',
      due_date: due,
      reminder_minutes: 1440,
    })
    const res = await page.request.get('/api/notifications/check')
    const body = await res.json()
    expect(res.ok()).toBe(true)
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
  })
})
