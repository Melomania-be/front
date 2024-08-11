import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
	const data = await request.json();

	const res = await fetch(`${API_URL}/mailing/`, {
		method: 'POST',
		headers: {
			authorization: `${await getToken(cookies)}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	});
	return res;
};
