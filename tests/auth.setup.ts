import { test as setup } from '@playwright/test'

setup('authenticate', async ({ page }) => {
	await page.route('**/api/sign_in', async route => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success: true, token: 'mock-token' })
		});
	});

	// On attend que la page et le réseau soient totalement chargés
	await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' })
	await page.waitForTimeout(2000)

	await page.locator('#email').fill('admin@admin.admin')
	await page.locator('#password').fill('admin')

	// L'astuce ultime : on synchronise le clic et l'attente de la redirection
	await Promise.all([
		page.waitForNavigation({ url: 'http://localhost:5173/', waitUntil: 'networkidle' }),
		page.locator('button[type="submit"]').click()
	])

	await page.context().storageState({ path: 'tests/.auth/user.json' })
})