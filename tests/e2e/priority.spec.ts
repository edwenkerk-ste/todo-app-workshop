import { test, expect } from '@playwright/test'
import { seedSession, clearAllTodos, createTodo } from '../helpers'

test.describe('Priority System', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page)
    await page.goto('/')
    await clearAllTodos(page)
  })

  test('Create todo with each priority level', async ({ page }) => {
    for (const priority of ['high', 'medium', 'low'] as const) {
      await createTodo(page, { title: `Priority ${priority} todo`, priority })
    }
    await page.goto('/')
    await expect(page.locator('.todo-item__title', { hasText: 'Priority high todo' })).toBeVisible()
    await expect(page.locator('.todo-item__title', { hasText: 'Priority medium todo' })).toBeVisible()
    await expect(page.locator('.todo-item__title', { hasText: 'Priority low todo' })).toBeVisible()
  })

  test('Edit priority', async ({ page }) => {
    await createTodo(page, { title: 'Edit priority todo', priority: 'low' })
    await page.goto('/')
    await page.locator('.todo-item').filter({ hasText: 'Edit priority todo' }).getByRole('button', { name: 'Edit' }).click()
    await page.getByLabel('Priority').selectOption('high')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('.todo-item').filter({ hasText: 'Edit priority todo' }).locator('.badge--high')).toBeVisible()
  })

  test('Filter by priority', async ({ page }) => {
    await createTodo(page, { title: 'High only', priority: 'high' })
    await createTodo(page, { title: 'Low only', priority: 'low' })
    await page.goto('/')
    await page.getByLabel('Filter by priority').selectOption('high')
    await expect(page.locator('.todo-item__title', { hasText: 'High only' })).toBeVisible()
    await expect(page.locator('.todo-item__title', { hasText: 'Low only' })).not.toBeVisible()
  })

  test('Verify sorting (high→medium→low)', async ({ page }) => {
    await createTodo(page, { title: 'Low first', priority: 'low' })
    await createTodo(page, { title: 'High first', priority: 'high' })
    await createTodo(page, { title: 'Medium mid', priority: 'medium' })
    await page.goto('/')
    const items = page.locator('.todo-item-wrapper')
    await expect(items.nth(0)).toContainText('High first')
    await expect(items.nth(1)).toContainText('Medium mid')
    await expect(items.nth(2)).toContainText('Low first')
  })
})
