import { test, expect } from '@playwright/test'
import { seedSession, clearAllTodos, createTodo, createTag } from '../helpers'

test.describe('Tag System', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page)
    await page.goto('/')
    await clearAllTodos(page)
  })

  test('Create tag', async ({ page }) => {
    await page.getByRole('button', { name: 'Manage Tags' }).click()
    await page.getByPlaceholder('Tag name').fill('Work')
    await page.getByRole('button', { name: 'Create Tag' }).click()
    await expect(page.locator('text=Work')).toBeVisible()
  })

  test('Edit tag name/color', async ({ page }) => {
    await createTag(page, { name: 'Original', color: '#14b8a6' })
    await page.goto('/')
    await page.getByRole('button', { name: 'Manage Tags' }).click()
    const li = page.locator('li', { hasText: 'Original' })
    await li.getByRole('button', { name: 'Edit' }).first().click()
    await li.locator('input').first().fill('Edited')
    await li.getByRole('button', { name: 'Save' }).click()
    await expect(page.locator('text=Edited')).toBeVisible()
    await expect(page.locator('text=Original')).not.toBeVisible()
  })

  test('Delete tag', async ({ page }) => {
    await createTag(page, { name: 'To delete' })
    await page.goto('/')
    await page.getByRole('button', { name: 'Manage Tags' }).click()
    await page.locator('li', { hasText: 'To delete' }).getByRole('button', { name: 'Delete' }).first().click()
    await expect(page.locator('text=To delete')).not.toBeVisible()
  })

  test('Assign multiple tags to todo', async ({ page }) => {
    const { id: tag1 } = await createTag(page, { name: 'TagA' })
    const { id: tag2 } = await createTag(page, { name: 'TagB' })
    await page.getByRole('button', { name: 'New todo' }).click()
    await page.getByPlaceholder('What needs to be done?').fill('Multi-tag todo')
    await page.getByRole('checkbox', { name: 'TagA' }).check()
    await page.getByRole('checkbox', { name: 'TagB' }).check()
    await page.getByRole('button', { name: 'Add todo' }).click()
    await expect(page.locator('.todo-item').filter({ hasText: 'Multi-tag todo' }).locator('button', { name: 'Filter by tag TagA' })).toBeVisible()
    await expect(page.locator('.todo-item').filter({ hasText: 'Multi-tag todo' }).locator('button', { name: 'Filter by tag TagB' })).toBeVisible()
  })

  test('Filter by tag', async ({ page }) => {
    const { id: tagId } = await createTag(page, { name: 'FilterTag' })
    await createTodo(page, { title: 'With tag', tag_ids: [tagId] })
    await createTodo(page, { title: 'Without tag' })
    await page.goto('/')
    await page.getByRole('button', { name: 'Filter by tag FilterTag' }).click()
    await expect(page.locator('.todo-item__title', { hasText: 'With tag' })).toBeVisible()
    await expect(page.locator('.todo-item__title', { hasText: 'Without tag' })).not.toBeVisible()
  })

  test('Duplicate tag name validation', async ({ page }) => {
    await createTag(page, { name: 'UniqueName' })
    await page.goto('/')
    await page.getByRole('button', { name: 'Manage Tags' }).click()
    await page.getByPlaceholder('Tag name').fill('UniqueName')
    await page.getByRole('button', { name: 'Create Tag' }).click()
    await expect(page.locator('text=already exists')).toBeVisible({ timeout: 3000 })
  })
})
