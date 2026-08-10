import { test as setup } from '@playwright/test'

setup('authenticate', async ({ page }) => {
	await page.route('**/api/sign_in', async route => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success: true })
		});
	});

	await page.goto('http://localhost:5173/login')

	// La pause magique pour compenser la lenteur de GitHub Actions
	await page.waitForTimeout(3000)

	await page.locator('#email').fill('admin@admin.admin')
	await page.locator('#password').fill('admin')

	await page.locator('button[type="submit"]').click()

	await page.waitForURL('http://localhost:5173/', { timeout: 15000 })

	await page.context().storageState({ path: 'tests/.auth/user.json' })
})