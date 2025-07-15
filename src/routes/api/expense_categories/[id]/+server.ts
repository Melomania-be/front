import { API_URL } from '$env/static/private'
import { getToken } from '$lib/server/authentification'
import type { RequestHandler } from '@sveltejs/kit'
/**
 * DELETE /expense_category?id=5
 * Supprime une catégorie selon son ID
 */
export const DELETE: RequestHandler = async ({params, fetch, cookies }) => {
	const res = await fetch(`${API_URL}/expense_categories/${params.id}`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		}
	})

	return res
}