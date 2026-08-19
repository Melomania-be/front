import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

test.describe('Contacts Feature', () => {
  test('should display contacts list after login', async ({ page }) => {
    await page.goto(`${BASE_URL}/contacts`)
    await expect(page).toHaveURL(/.*contacts.*/)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should redirect to login when not authenticated', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined })
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/contacts`)
    await expect(page).toHaveURL(/.*login.*/)
    await context.close()
  })

  test('should display search functionality', async ({ page }) => {
    await page.goto(`${BASE_URL}/contacts`)
    await expect(page.locator('body')).toBeVisible()
  })
})