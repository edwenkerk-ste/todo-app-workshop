import { test, expect } from '@playwright/test'
import { seedSession, clearAllTodos, createTodo, FIXED_FUTURE_DUE } from '../helpers'

test.describe('Recurring Todos', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page)
    await page.goto('/')
    await clearAllTodos(page)
  })

  test('Create daily recurring todo', async ({ page }) => {
    const due = FIXED_FUTURE_DUE
    await page.getByRole('button', { name: 'New todo' }).click()
    await page.getByPlaceholder('What needs to be done?').fill('Daily standup')
    await page.getByLabel('Due date').fill(due)
    await page.getByRole('checkbox', { name: /Repeat/ }).check()
    await page.getByLabel('Recurrence pattern').selectOption('daily')
    await page.getByRole('button', { name: 'Add todo' }).click()
    await expect(page.locator('.todo-item__title', { hasText: 'Daily standup' })).toBeVisible()
    await expect(page.locator('text=🔄 daily')).toBeVisible()
  })

  test('Create weekly recurring todo', async ({ page }) => {
    const due = FIXED_FUTURE_DUE
    await page.getByRole('button', { name: 'New todo' }).click()
    await page.getByPlaceholder('What needs to be done?').fill('Weekly review')
    await page.getByLabel('Due date').fill(due)
    await page.getByRole('checkbox', { name: /Repeat/ }).check()
    await page.getByLabel('Recurrence pattern').selectOption('weekly')
    await page.getByRole('button', { name: 'Add todo' }).click()
    await expect(page.locator('text=🔄 weekly')).toBeVisible()
  })

  test('Complete recurring todo creates next instance', async ({ page }) => {
    const due = FIXED_FUTURE_DUE
    const { id } = await createTodo(page, {
      title: 'Recurring task',
      due_date: due,
      is_recurring: true,
      recurrence_pattern: 'daily',
    })
    await page.goto('/')
    await page.locator('.todo-item').filter({ hasText: 'Recurring task' }).getByRole('checkbox').check()
    await page.waitForTimeout(500)
    await expect(page.locator('.todo-item__title', { hasText: 'Recurring task' }).first()).toBeVisible({ timeout: 3000 })
  })

  test('Next instance has correct due date', async ({ page }) => {
    const due = FIXED_FUTURE_DUE
    await createTodo(page, {
      title: 'Next due todo',
      due_date: due,
      is_recurring: true,
      recurrence_pattern: 'daily',
    })
    await page.goto('/')
    await page.locator('.todo-item').filter({ hasText: 'Next due todo' }).getByRole('checkbox').check()
    await page.waitForTimeout(500)
    const items = page.locator('.todo-item__title', { hasText: 'Next due todo' })
    await expect(items).toHaveCount(2, { timeout: 3000 })
  })

  test('Next instance inherits metadata', async ({ page }) => {
    const due = FIXED_FUTURE_DUE
    await createTodo(page, {
      title: 'Inherit meta',
      due_date: due,
      priority: 'high',
      is_recurring: true,
      recurrence_pattern: 'weekly',
      reminder_minutes: 60,
    })
    await page.goto('/')
    await page.locator('.todo-item').filter({ hasText: 'Inherit meta' }).getByRole('checkbox').check()
    await page.waitForTimeout(500)
    await expect(page.locator('.todo-item').filter({ hasText: 'Inherit meta' }).locator('.badge--high').first()).toBeVisible({ timeout: 3000 })
  })
})
