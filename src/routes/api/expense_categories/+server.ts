import { API_URL } from '$env/static/private'
import { getToken } from '$lib/server/authentification'
import type { RequestHandler } from '@sveltejs/kit'

/**
 * GET /expense_category
 * Récupère toutes les catégories
 */
export const GET: RequestHandler = async ({ fetch, cookies }) => {
	const res = await fetch(`${API_URL}/expense_categories`, {
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		}
	})

	return res
}

/**
 * POST /expense_category
 * Crée ou met à jour une catégorie
 */
export const POST: RequestHandler = async ({ request, fetch, cookies }) => {
	const body = await request.json()

	const res = await fetch(`${API_URL}/expense_categories`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify(body)
	})

	return res
}