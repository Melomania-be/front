import { getToken } from '$lib/server/authentification'
import { API_URL } from '$env/static/private'
import type { RequestHandler } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ cookies, fetch, request }) => {
	const payload = await request.text()

	const res = await fetch(`${API_URL}/notifications/register-device`, {
		method: 'POST',
		headers: {
			authorization: `${await getToken(cookies)}`,
			'Content-Type': 'application/json',
		},
		body: payload,
	})

	return res
}
