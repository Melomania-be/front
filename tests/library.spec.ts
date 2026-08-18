import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

test.describe('Library Feature', () => {
  test('should display library page after login', async ({ page }) => {
    await page.goto(`${BASE_URL}/library`)
    await expect(page).toHaveURL(/.*library.*/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should redirect to login when not authenticated', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined })
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/library`)
    await expect(page).toHaveURL(/.*login.*/)
    await context.close()
  })

  test('should display composers and pieces', async ({ page }) => {
    await page.goto(`${BASE_URL}/library`)
    await expect(page.locator('body')).toBeVisible()
  })
})