import { test, expect, type Page } from '@playwright/test'
import fs from 'fs'

const TODO_TITLE = 'E2E Export Import Test Todo'

async function clearAllTodos(page: Page) {
  const res = await page.request.get('/api/todos')
  const body = await res.json()
  if (body?.success && Array.isArray(body.data)) {
    for (const todo of body.data) {
      await page.request.delete(`/api/todos/${todo.id}`)
    }
  }
}

test.describe('Export & Import', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await clearAllTodos(page)
  })

  test('exports todos to a JSON file', async ({ page, context }) => {
    // Create a todo via API so we have a stable ID in export
    await page.request.post('/api/todos', {
      data: { title: TODO_TITLE, priority: 'medium' },
    })

    await page.goto('/')

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export' }).click(),
    ])

    const downloadPath = await download.path()
    expect(downloadPath).toBeTruthy()

    const json = JSON.parse(fs.readFileSync(downloadPath!, 'utf8'))
    expect(json.version).toBe(1)
    expect(Array.isArray(json.todos)).toBe(true)
    expect(json.todos.some((t: any) => t.title === TODO_TITLE)).toBe(true)
    expect(Array.isArray(json.tags)).toBe(true)
    expect(Array.isArray(json.subtasks)).toBe(true)
    expect(Array.isArray(json.todo_tags)).toBe(true)
  })

  test('imports todos from a JSON file and renders them', async ({ page }, testInfo) => {
    const payload = {
      version: 1,
      todos: [
        {
          id: 'import-test-1',
          title: TODO_TITLE,
          due_date: null,
          priority: 'medium',
          is_recurring: false,
          recurrence_pattern: null,
          completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      tags: [],
      subtasks: [],
      todo_tags: [],
    }

    const filePath = testInfo.outputPath('import.json')
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8')

    await page.goto('/')
    await page.getByRole('button', { name: 'Import' }).click()
    await page.locator('input[type=file]').setInputFiles(filePath)

    // Wait for the success info message
    await expect(page.locator('text=Imported')).toBeVisible()

    // The imported todo should render in the UI list
    await expect(page.locator('.todo-item__title', { hasText: TODO_TITLE })).toBeVisible()
  })

  test('shows error message when importing invalid JSON', async ({ page }, testInfo) => {
    const filePath = testInfo.outputPath('invalid.json')
    fs.writeFileSync(filePath, 'this is not json', 'utf8')

    await page.goto('/')
    await page.getByRole('button', { name: 'Import' }).click()
    await page.locator('input[type=file]').setInputFiles(filePath)

    await expect(page.locator('body')).toContainText('Unexpected token')
  })
})
