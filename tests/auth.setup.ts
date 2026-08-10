import { test as setup } from '@playwright/test'

setup('authenticate', async ({ page }) => {
	await page.route('**/api/sign_in', async route => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success: true, token: 'mock-token' })
		});
	});

	await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
	await page.waitForTimeout(2000)

	await page.locator('#email').fill('admin@admin.admin')
	await page.locator('#password').fill('admin')

	// On utilise waitForURL avec 'load' au lieu de 'networkidle'
	await Promise.all([
		page.waitForURL('http://localhost:5173/', { waitUntil: 'load', timeout: 30000 }),
		page.locator('button[type="submit"]').click()
	])

	await page.context().storageState({ path: 'tests/.auth/user.json' })
})