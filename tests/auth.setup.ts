import { test as setup } from '@playwright/test'

setup('authenticate', async ({ page }) => {
	await page.route('**/api/sign_in', async route => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({ success: true, token: 'mock-token' })
		});
	});

	await page.goto('http://localhost:5173/login')
	await page.waitForTimeout(2000)

	await page.locator('#email').fill('admin@admin.admin')
	await page.locator('#password').fill('admin')

	// On écoute la requête réseau interceptée
	const responsePromise = page.waitForResponse(r => r.url().includes('/api/sign_in'));

	// On clique
	await page.locator('button[type="submit"]').click();

	// On attend que le clic valide l'appel réseau
	await responsePromise;

	// On donne 2 secondes au navigateur pour exécuter son "window.location.href = '/'"
	await page.waitForTimeout(2000);

	// On sauvegarde (peu importe où le navigateur en est, le token est dans le cache)
	await page.context().storageState({ path: 'tests/.auth/user.json' })
})