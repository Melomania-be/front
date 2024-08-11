import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const DELETE: RequestHandler = async ({ cookies, fetch, params }) => {
	const res = await fetch(`${API_URL}/sections/${params.id}`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};
