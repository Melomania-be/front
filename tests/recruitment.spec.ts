import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5173'

test.describe('Recruitment Feature', () => {
  test('should redirect to login when not authenticated', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined })
    const page = await context.newPage()
    await page.goto(`${BASE_URL}/projects/1/management/recruitment`)
    await expect(page).toHaveURL(/.*login.*/)
    await context.close()
  })

  test('should load recruitment page for authenticated user', async ({ page }) => {
    await page.goto(`${BASE_URL}/projects/1/management/recruitment`)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should load projects page for authenticated user', async ({ page }) => {
    await page.goto(`${BASE_URL}/projects`)
    await expect(page).toHaveURL(/.*projects.*/)
    await expect(page.locator('body')).toBeVisible()
  })
})