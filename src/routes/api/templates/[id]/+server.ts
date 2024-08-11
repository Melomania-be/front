import { getToken } from '$lib/server/authentification';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const DELETE: RequestHandler = async ({ cookies, fetch, params }) => {
	const res = await fetch(`${API_URL}/templates/${params.id}`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		}
	});
	return res;
};
