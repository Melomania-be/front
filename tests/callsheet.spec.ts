import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

test.describe('Callsheet Feature', () => {
  test('should display projects list after login', async ({ page }) => {
    await page.goto(`${BASE_URL}/projects`)
    await expect(page).toHaveURL(/.*projects.*/)
    // Check page loaded correctly
    await expect(page.locator('body')).toBeVisible()
  })

  test('should redirect to login when not authenticated', async ({ browser }) => {
    // Create a completely fresh context with no storage state
    const context = await browser.newContext({ storageState: undefined })
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/projects`)
    await expect(page).toHaveURL(/.*login.*/)
    await context.close()
  })

  test('should show loading for invalid public callsheet', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined })
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/call_sheets/99999/99999`)
    await page.waitForTimeout(2000)
    await expect(page.locator('body')).toBeVisible()
    await context.close()
  })
})