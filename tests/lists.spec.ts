import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

test.describe('Lists Feature', () => {
  test('should display lists page after login', async ({ page }) => {
    await page.goto(`${BASE_URL}/contacts/lists`)
    await expect(page).toHaveURL(/.*lists.*/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should redirect to login when not authenticated', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined })
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/contacts/lists`)
    await expect(page).toHaveURL(/.*login.*/)
    await context.close()
  })

  test('should display lists content', async ({ page }) => {
    await page.goto(`${BASE_URL}/contacts/lists`)
    await expect(page.locator('body')).toBeVisible()
  })
})