import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const DELETE: RequestHandler = async ({ params, cookies, fetch }) => {
	const res = await fetch(`${API_URL}/filesystem/folders/${params.id}`, {
		method: 'DELETE',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});
	return res;
};

export const PATCH: RequestHandler = async ({ params, cookies, request, fetch }) => {
	const data = await request.json();

	const res = await fetch(`${API_URL}/filesystem/folders/${params.id}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify(data)
	});

	return res;
};