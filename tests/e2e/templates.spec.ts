import { test, expect } from '@playwright/test'
import { seedSession, clearAllTodos, createTodo, addSubtask } from '../helpers'

test.describe('Templates', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page)
    await page.goto('/')
    await clearAllTodos(page)
  })

  test('Save todo as template', async ({ page }) => {
    await createTodo(page, { title: 'My template todo', priority: 'high' })
    await page.goto('/')
    await page.locator('.todo-item').filter({ hasText: 'My template todo' }).getByRole('button', { name: 'Save as Template' }).click()
    await page.getByPlaceholder('e.g. Weekly Review').fill('Weekly Review')
    await page.getByRole('button', { name: 'Save Template' }).click()
    await page.getByRole('button', { name: 'Templates' }).click()
    await expect(page.locator('text=Weekly Review')).toBeVisible()
  })

  test('Create todo from template', async ({ page }) => {
    await createTodo(page, { title: 'Source for template', priority: 'low' })
    await page.goto('/')
    await page.locator('.todo-item').filter({ hasText: 'Source for template' }).getByRole('button', { name: 'Save as Template' }).click()
    await page.getByPlaceholder('e.g. Weekly Review').fill('From Template')
    await page.getByRole('button', { name: 'Save Template' }).click()
    await page.getByRole('button', { name: 'Templates' }).click()
    await page.getByRole('button', { name: 'Use' }).first().click()
    await expect(page.locator('.todo-item__title', { hasText: 'Source for template' })).toBeVisible({ timeout: 5000 })
  })

  test('Template preserves settings', async ({ page }) => {
    await page.getByRole('button', { name: 'New todo' }).click()
    await page.getByPlaceholder('What needs to be done?').fill('Preset todo')
    await page.getByLabel('Priority').selectOption('high')
    await page.getByRole('button', { name: 'Save as Template' }).click()
    await page.getByPlaceholder('e.g. Weekly Review').fill('Preset Template')
    await page.getByRole('button', { name: 'Save Template' }).click()
    await page.getByRole('button', { name: 'Templates' }).click()
    await expect(page.locator('text=Preset Template')).toBeVisible()
    await expect(page.locator('.badge--high').first()).toBeVisible()
  })

  test('Subtasks from template', async ({ page }) => {
    const { id } = await createTodo(page, { title: 'Todo with subtasks' })
    await addSubtask(page, id, 'Step 1')
    await addSubtask(page, id, 'Step 2')
    await page.goto('/')
    await page.locator('.todo-item').filter({ hasText: 'Todo with subtasks' }).getByRole('button', { name: 'Save as Template' }).click()
    await page.getByPlaceholder('e.g. Weekly Review').fill('Steps Template')
    await page.getByRole('button', { name: 'Save Template' }).click()
    await page.getByRole('button', { name: 'Templates' }).click()
    await page.getByRole('button', { name: 'Use' }).first().click()
    await expect(page.locator('.todo-item__title', { hasText: 'Todo with subtasks' })).toBeVisible({ timeout: 5000 })
    await page.locator('.todo-item').filter({ hasText: 'Todo with subtasks' }).getByRole('button', { name: 'Expand subtasks' }).click()
    await expect(page.locator('.subtask-item', { hasText: 'Step 1' })).toBeVisible({ timeout: 3000 })
    await expect(page.locator('.subtask-item', { hasText: 'Step 2' })).toBeVisible()
  })

  test('Edit template', async ({ page }) => {
    await createTodo(page, { title: 'Edit me', priority: 'medium' })
    await page.goto('/')
    await page.locator('.todo-item').filter({ hasText: 'Edit me' }).getByRole('button', { name: 'Save as Template' }).click()
    await page.getByPlaceholder('e.g. Weekly Review').fill('Edit Template')
    await page.getByRole('button', { name: 'Save Template' }).click()
    await page.getByRole('button', { name: 'Templates' }).click()
    await expect(page.locator('text=Edit Template')).toBeVisible()
  })

  test('Delete template', async ({ page }) => {
    await createTodo(page, { title: 'To delete template' })
    await page.goto('/')
    await page.locator('.todo-item').filter({ hasText: 'To delete template' }).getByRole('button', { name: 'Save as Template' }).click()
    await page.getByPlaceholder('e.g. Weekly Review').fill('Delete Me')
    await page.getByRole('button', { name: 'Save Template' }).click()
    await page.getByRole('button', { name: 'Templates' }).click()
    await expect(page.locator('text=Delete Me')).toBeVisible()
    await page.locator('li', { hasText: 'Delete Me' }).getByRole('button', { name: 'Delete' }).click()
    await expect(page.locator('text=Delete Me')).not.toBeVisible()
  })
})
