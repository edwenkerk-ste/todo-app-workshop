import { test, expect } from '@playwright/test'
import { seedSession } from '../helpers'

test.describe('Authentication', () => {
  test('Protected route redirects unauthenticated', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('Login page redirects when authenticated', async ({ page }) => {
    await seedSession(page)
    await page.goto('/login')
    await expect(page).toHaveURL('/')
  })

  test('Logout clears session', async ({ page }) => {
    await seedSession(page)
    await page.goto('/')
    await expect(page.locator('text=Todo App')).toBeVisible()
    await page.getByRole('button', { name: 'Logout' }).click()
    await expect(page).toHaveURL(/\/login/)
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('Calendar protected when unauthenticated', async ({ page }) => {
    await page.goto('/calendar')
    await expect(page).toHaveURL(/\/login/)
  })

  test('Authenticated user can access home and calendar', async ({ page }) => {
    await seedSession(page)
    await page.goto('/')
    await expect(page).toHaveURL('/')
    await expect(page.locator('h1', { hasText: 'Todo App' })).toBeVisible()
    await page.goto('/calendar')
    await expect(page).toHaveURL(/\/calendar/)
    await expect(page.locator('h1')).toContainText('Calendar')
  })
})
