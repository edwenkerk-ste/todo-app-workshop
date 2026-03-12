import { test, expect } from '@playwright/test'
import { seedSession, clearAllTodos, createTodo, futureDueDateLocal, FIXED_PAST_DUE } from '../helpers'

test.describe('Todo CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page)
    await page.goto('/')
    await clearAllTodos(page)
  })

  test('Create todo with title only', async ({ page }) => {
    await page.getByRole('button', { name: 'New todo' }).click()
    await page.getByPlaceholder('What needs to be done?').fill('Buy milk')
    await page.getByRole('button', { name: 'Add todo' }).click()
    await expect(page.locator('.todo-item__title', { hasText: 'Buy milk' })).toBeVisible()
  })

  test('Create todo with all metadata', async ({ page }) => {
    const due = futureDueDateLocal(120)
    await page.getByRole('button', { name: 'New todo' }).click()
    await page.getByPlaceholder('What needs to be done?').fill('Full metadata todo')
    await page.getByLabel('Due date').fill(due)
    await page.getByLabel('Priority').selectOption('high')
    await page.getByLabel('Reminder').selectOption('60')
    await page.getByRole('checkbox', { name: /Repeat/ }).check()
    await page.getByLabel('Recurrence pattern').selectOption('weekly')
    await page.getByRole('button', { name: 'Add todo' }).click()
    await expect(page.locator('.todo-item__title', { hasText: 'Full metadata todo' })).toBeVisible()
    await expect(page.locator('.badge--high')).toBeVisible()
    await expect(page.locator('text=🔄 weekly')).toBeVisible()
    await expect(page.locator('text=🔔 1h')).toBeVisible()
  })

  test('Edit todo', async ({ page }) => {
    await createTodo(page, { title: 'Original title' })
    await page.goto('/')
    await page.locator('.todo-item').filter({ hasText: 'Original title' }).getByRole('button', { name: 'Edit' }).click()
    await page.getByLabel('Title').fill('Updated title')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('.todo-item__title', { hasText: 'Updated title' })).toBeVisible()
    await expect(page.locator('.todo-item__title', { hasText: 'Original title' })).not.toBeVisible()
  })

  test('Toggle completion', async ({ page }) => {
    await createTodo(page, { title: 'To complete' })
    await page.goto('/')
    await expect(page.getByRole('tab', { name: 'Active' })).toBeVisible()
    await page.locator('.todo-item').filter({ hasText: 'To complete' }).getByRole('checkbox').check()
    await page.getByRole('tab', { name: 'Completed' }).click()
    await expect(page.locator('.todo-item__title', { hasText: 'To complete' })).toBeVisible()
  })

  test('Delete todo', async ({ page }) => {
    await createTodo(page, { title: 'To delete' })
    await page.goto('/')
    await page.locator('.todo-item').filter({ hasText: 'To delete' }).getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Delete' }).last().click()
    await expect(page.locator('.todo-item__title', { hasText: 'To delete' })).not.toBeVisible()
  })

  test('Past due date validation', async ({ page }) => {
    await page.getByRole('button', { name: 'New todo' }).click()
    await page.getByPlaceholder('What needs to be done?').fill('Past due todo')
    await page.getByLabel('Due date').fill(FIXED_PAST_DUE)
    await page.getByRole('button', { name: 'Add todo' }).click()
    await expect(page.locator('text=/future|1 minute/i')).toBeVisible({ timeout: 5000 })
  })
})
