import { test, expect } from '@playwright/test'
import { seedSession, clearAllTodos, createTodo, addSubtask } from '../helpers'

test.describe('Subtasks & Progress', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page)
    await page.goto('/')
    await clearAllTodos(page)
  })

  test('Expand subtasks section', async ({ page }) => {
    const { id } = await createTodo(page, { title: 'Todo with subtasks' })
    await addSubtask(page, id, 'Subtask one')
    await page.goto('/')
    await page.locator('.todo-item').filter({ hasText: 'Todo with subtasks' }).getByRole('button', { name: 'Expand subtasks' }).click()
    await expect(page.locator('.subtask-section').filter({ hasText: 'Subtask one' })).toBeVisible()
  })

  test('Add multiple subtasks', async ({ page }) => {
    const { id } = await createTodo(page, { title: 'Multi subtask todo' })
    await page.goto('/')
    await page.locator('.todo-item').filter({ hasText: 'Multi subtask todo' }).getByRole('button', { name: 'Expand subtasks' }).click()
    await page.getByPlaceholder('Add a subtask…').fill('First')
    await page.getByRole('button', { name: 'Add' }).click()
    await page.getByPlaceholder('Add a subtask…').fill('Second')
    await page.getByRole('button', { name: 'Add' }).click()
    await expect(page.locator('.subtask-item', { hasText: 'First' })).toBeVisible()
    await expect(page.locator('.subtask-item', { hasText: 'Second' })).toBeVisible()
  })

  test('Toggle subtask completion', async ({ page }) => {
    const { id } = await createTodo(page, { title: 'Toggle subtask todo' })
    await addSubtask(page, id, 'Check me')
    await page.goto('/')
    await page.locator('.todo-item').filter({ hasText: 'Toggle subtask todo' }).getByRole('button', { name: 'Expand subtasks' }).click()
    await page.locator('.subtask-item').filter({ hasText: 'Check me' }).getByRole('checkbox').check()
    await expect(page.locator('.subtask-item').filter({ hasText: 'Check me' }).locator('span')).toHaveCSS('text-decoration', /line-through/)
  })

  test('Progress bar updates', async ({ page }) => {
    const { id } = await createTodo(page, { title: 'Progress todo' })
    await addSubtask(page, id, 'A')
    await addSubtask(page, id, 'B')
    await page.goto('/')
    await page.locator('.todo-item').filter({ hasText: 'Progress todo' }).getByRole('button', { name: 'Expand subtasks' }).click()
    await expect(page.locator('.progress-label')).toContainText(/0\/2|0%/)
    await page.locator('.subtask-item').filter({ hasText: 'A' }).getByRole('checkbox').check()
    await expect(page.locator('.progress-label')).toContainText(/1\/2|50%/)
    await page.locator('.subtask-item').filter({ hasText: 'B' }).getByRole('checkbox').check()
    await expect(page.locator('.progress-label')).toContainText(/2\/2|100%/)
  })

  test('Delete subtask', async ({ page }) => {
    const { id } = await createTodo(page, { title: 'Delete subtask todo' })
    await addSubtask(page, id, 'To remove')
    await page.goto('/')
    await page.locator('.todo-item').filter({ hasText: 'Delete subtask todo' }).getByRole('button', { name: 'Expand subtasks' }).click()
    await page.getByRole('button', { name: 'Delete subtask To remove' }).click()
    await expect(page.locator('.subtask-item', { hasText: 'To remove' })).not.toBeVisible()
  })

  test('Delete todo cascades to subtasks', async ({ page }) => {
    const { id } = await createTodo(page, { title: 'Cascade delete todo' })
    await addSubtask(page, id, 'Orphan subtask')
    await page.goto('/')
    await page.locator('.todo-item').filter({ hasText: 'Cascade delete todo' }).getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Delete' }).last().click()
    await expect(page.locator('.todo-item__title', { hasText: 'Cascade delete todo' })).not.toBeVisible()
    const res = await page.request.get(`/api/todos/${id}/subtasks`)
    expect(res.status()).toBe(404)
  })
})
