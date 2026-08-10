import { test as setup } from '@playwright/test'

setup('authenticate', async ({ page }) => {
	// 1. On intercepte l'appel exact fait par ton frontend
	await page.route('**/api/sign_in', async route => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success: true })
		});
	});

	// 2. On charge la page de login
	await page.goto('http://localhost:5173/login')

	// 3. On remplit le formulaire
	await page.locator('#email').click()
	await page.locator('#email').pressSequentially('admin@admin.admin')
	await page.locator('#password').click()
	await page.locator('#password').pressSequentially('admin')

	// 4. On valide
	await page.locator('button[type="submit"]').click()

	// 5. On attend la BONNE redirection (vers l'accueil)
	await page.waitForURL('http://localhost:5173/', { timeout: 15000 })

	// 6. On sauvegarde l'état
	await page.context().storageState({ path: 'tests/.auth/user.json' })
})