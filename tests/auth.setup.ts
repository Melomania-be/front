import { test as setup } from '@playwright/test'

setup('authenticate', async ({ page }) => {
	await page.route('**/api/sign_in', async route => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			// Ajout d'un token factice pour satisfaire la logique du front
			body: JSON.stringify({ success: true, token: 'mock-token' })
		});
	});

	await page.goto('http://localhost:5173/login')

	// Petite pause pour s'assurer que l'hydratation de Svelte est terminée
	await page.waitForTimeout(2000)

	await page.locator('#email').fill('admin@admin.admin')
	await page.locator('#password').fill('admin')

	await page.locator('button[type="submit"]').click()

	// On rallonge le timeout à 30 secondes pour laisser le temps à GitHub Actions
	await page.waitForURL('http://localhost:5173/', { timeout: 30000 })

	await page.context().storageState({ path: 'tests/.auth/user.json' })
})