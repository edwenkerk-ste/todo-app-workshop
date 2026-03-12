import { test, expect, type Page } from '@playwright/test'
import { seedSession } from '../helpers'

async function seedTodoWithDueDate(page: Page, title: string, dueDate: string) {
  await page.request.post('/api/todos', {
    data: { title, priority: 'high', due_date: dueDate },
  })
}

async function seedHoliday(page: Page, date: string, name: string) {
  await page.request.post('/api/holidays', {
    data: {
      holidays: [{ date, name }],
    },
  })
}

test.describe('Calendar View (Feature 10)', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page)
  })

  test('calendar page loads and shows current month', async ({ page }) => {
    await page.goto('/calendar')
    await expect(page.locator('h1')).toContainText('Calendar')

    // Should show day headers
    for (const day of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
      await expect(page.getByRole('columnheader', { name: day })).toBeVisible()
    }

    // Should have the month/year display
    const now = new Date()
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ]
    // URL should have ?month param
    await expect(page).toHaveURL(/month=/)
  })

  test('navigates to previous and next month', async ({ page }) => {
    await page.goto('/calendar')

    // Get current month text
    const monthDisplay = page.locator('span').filter({ hasText: /^\w+ \d{4}$/ }).first()
    const initialText = await monthDisplay.textContent()

    // Click next month
    await page.getByRole('button', { name: 'Next month' }).click()
    await expect(monthDisplay).not.toHaveText(initialText!)

    // Click prev month twice to go back one
    await page.getByRole('button', { name: 'Previous month' }).click()
    await expect(monthDisplay).toHaveText(initialText!)
  })

  test('today button returns to current month', async ({ page }) => {
    await page.goto('/calendar')

    // Navigate away
    await page.getByRole('button', { name: 'Next month' }).click()
    await page.getByRole('button', { name: 'Next month' }).click()

    // Click today
    await page.getByRole('button', { name: 'Go to today' }).click()

    // URL should reflect current month
    const now = new Date()
    const expectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    await expect(page).toHaveURL(new RegExp(`month=${expectedMonth}`))
  })

  test('todo appears on its due date in calendar', async ({ page }) => {
    // Create a todo with a specific due date
    const dueDate = '2026-03-15T10:00:00.000Z'
    await seedTodoWithDueDate(page, 'Calendar Test Todo', dueDate)

    await page.goto('/calendar?month=2026-03')

    // The todo should appear on March 15
    const cell = page.getByRole('gridcell', { name: /2026-03-15/ })
    await expect(cell).toContainText('Calendar Test Todo')
  })

  test('holiday appears on correct date', async ({ page }) => {
    // Seed a test holiday
    await seedHoliday(page, '2026-03-20', 'Hari Raya Puasa')

    await page.goto('/calendar?month=2026-03')

    // Holiday should appear on March 20
    const cell = page.getByRole('gridcell', { name: /2026-03-20/ })
    await expect(cell).toContainText('Hari Raya Puasa')
  })

  test('clicking a day opens the modal with details', async ({ page }) => {
    const dueDate = '2026-04-10T09:00:00.000Z'
    await seedTodoWithDueDate(page, 'Modal Test Todo', dueDate)

    await page.goto('/calendar?month=2026-04')

    // Click on April 10
    const cell = page.getByRole('gridcell', { name: /2026-04-10/ })
    await cell.click()

    // Modal should appear with the day details
    const modal = page.locator('.modal')
    await expect(modal).toBeVisible()
    await expect(modal).toContainText('Modal Test Todo')
    await expect(modal).toContainText('high')

    // Close modal
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(modal).not.toBeVisible()
  })

  test('URL state management with ?month= parameter', async ({ page }) => {
    // Navigate directly to a specific month
    await page.goto('/calendar?month=2026-06')

    // Should show June 2026
    await expect(page.locator('text=June 2026')).toBeVisible()

    // Navigate to next month
    await page.getByRole('button', { name: 'Next month' }).click()
    await expect(page).toHaveURL(/month=2026-07/)
    await expect(page.locator('text=July 2026')).toBeVisible()
  })

  test('back button navigates to home page', async ({ page }) => {
    await page.goto('/calendar')
    await page.getByRole('link', { name: 'Back to todo list' }).click()
    await expect(page).toHaveURL('/')
  })
})
