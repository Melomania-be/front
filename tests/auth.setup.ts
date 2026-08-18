import { test as setup, expect } from '@playwright/test'

setup('authenticate', async ({ page }) => {
  await page.goto('http://localhost:5173/login')
  await page.waitForSelector('#email')
  
  await page.locator('#email').click()
  await page.locator('#email').pressSequentially('admin@admin.admin', { delay: 50 })
  await page.locator('#password').click()
  await page.locator('#password').pressSequentially('admin', { delay: 50 })
  
  await expect(page.locator('#email')).toHaveValue('admin@admin.admin')
  
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/.*projects.*/, { timeout: 15000 })
  
  await page.context().storageState({ path: 'tests/.auth/user.json' })
})