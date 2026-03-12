import { test, expect } from '@playwright/test'
import { seedSession, clearAllTodos, createTodo, createTag } from '../helpers'

test.describe('Search & Filter', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page)
    await page.goto('/')
    await clearAllTodos(page)
  })

  test('Search by title', async ({ page }) => {
    await createTodo(page, { title: 'Alpha beta gamma' })
    await createTodo(page, { title: 'Delta epsilon' })
    await page.goto('/')
    await page.getByPlaceholder('Search by title or tag…').fill('beta')
    await expect(page.locator('.todo-item__title', { hasText: 'Alpha beta gamma' })).toBeVisible()
    await expect(page.locator('.todo-item__title', { hasText: 'Delta epsilon' })).not.toBeVisible()
  })

  test('Search by tag name', async ({ page }) => {
    const { id: tagId } = await createTag(page, { name: 'SearchTag' })
    await createTodo(page, { title: 'Has tag', tag_ids: [tagId] })
    await createTodo(page, { title: 'No tag' })
    await page.goto('/')
    await page.getByPlaceholder('Search by title or tag…').fill('SearchTag')
    await expect(page.locator('.todo-item__title', { hasText: 'Has tag' })).toBeVisible()
    await expect(page.locator('.todo-item__title', { hasText: 'No tag' })).not.toBeVisible()
  })

  test('Filter by priority', async ({ page }) => {
    await createTodo(page, { title: 'P High', priority: 'high' })
    await createTodo(page, { title: 'P Low', priority: 'low' })
    await page.goto('/')
    await page.getByLabel('Filter by priority').selectOption('high')
    await expect(page.locator('.todo-item__title', { hasText: 'P High' })).toBeVisible()
    await expect(page.locator('.todo-item__title', { hasText: 'P Low' })).not.toBeVisible()
  })

  test('Filter by tag', async ({ page }) => {
    const { id: tagId } = await createTag(page, { name: 'FilterTag' })
    await createTodo(page, { title: 'Tagged', tag_ids: [tagId] })
    await createTodo(page, { title: 'Untagged' })
    await page.goto('/')
    await page.getByRole('button', { name: 'Filter by tag FilterTag' }).click()
    await expect(page.locator('.todo-item__title', { hasText: 'Tagged' })).toBeVisible()
    await expect(page.locator('.todo-item__title', { hasText: 'Untagged' })).not.toBeVisible()
  })

  test('Combine filters', async ({ page }) => {
    const { id: tagId } = await createTag(page, { name: 'ComboTag' })
    await createTodo(page, { title: 'Match both', priority: 'high', tag_ids: [tagId] })
    await createTodo(page, { title: 'High only', priority: 'high' })
    await createTodo(page, { title: 'Tagged only', tag_ids: [tagId] })
    await page.goto('/')
    await page.getByLabel('Filter by priority').selectOption('high')
    await page.getByPlaceholder('Search by title or tag…').fill('Match')
    await expect(page.locator('.todo-item__title', { hasText: 'Match both' })).toBeVisible()
    await expect(page.locator('.todo-item__title', { hasText: 'High only' })).not.toBeVisible()
    await expect(page.locator('.todo-item__title', { hasText: 'Tagged only' })).not.toBeVisible()
  })

  test('Clear filters', async ({ page }) => {
    await createTodo(page, { title: 'Clear test' })
    await page.goto('/')
    await page.getByLabel('Filter by priority').selectOption('low')
    await expect(page.locator('.todo-item__title', { hasText: 'Clear test' })).not.toBeVisible()
    await page.getByRole('button', { name: 'Clear filters' }).click()
    await expect(page.locator('.todo-item__title', { hasText: 'Clear test' })).toBeVisible()
  })
})
