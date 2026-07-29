import { getToken } from '$lib/server/authentification'
import { API_URL } from '$env/static/private'
import type { RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = async ({ cookies, fetch, url }) => {
	const query = url.searchParams.toString()
	const suffix = query ? `?${query}` : ''

	const res = await fetch(`${API_URL}/notifications${suffix}`, {
		method: 'GET',
		headers: {
			authorization: `${await getToken(cookies)}`,
		},
	})

	return res
}
