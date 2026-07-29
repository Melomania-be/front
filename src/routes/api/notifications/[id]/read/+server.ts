import { getToken } from '$lib/server/authentification'
import { API_URL } from '$env/static/private'
import type { RequestHandler } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ cookies, fetch, params }) => {
	const res = await fetch(`${API_URL}/notifications/${params.id}/read`, {
		method: 'POST',
		headers: {
			authorization: `${await getToken(cookies)}`,
		},
	})

	return res
}
