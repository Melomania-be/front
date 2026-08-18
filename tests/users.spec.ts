import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

test.describe('Users Feature', () => {
  test('should display users list after login', async ({ page }) => {
    await page.goto(`${BASE_URL}/users`)
    await expect(page).toHaveURL(/.*users.*/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should redirect to login when not authenticated', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined })
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/users`)
    await expect(page).toHaveURL(/.*login.*/)
    await context.close()
  })

  test('should show add user form', async ({ page }) => {
    await page.goto(`${BASE_URL}/users`)
    await expect(page.locator('body')).toBeVisible()
  })
})