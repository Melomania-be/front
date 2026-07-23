import { getToken } from '$lib/server/authentification';
import type { RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const PUT: RequestHandler = async ({
	cookies,
	fetch,
	request,
	params
}) => {
	const data = await request.json();

	const res = await fetch(`${API_URL}/organization/${params.id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify(data)
	});

	return res;
};
export const DELETE: RequestHandler = async ({
	cookies,
	fetch,
	params
}) => {
	const res = await fetch(`${API_URL}/organization/${params.id}`, {
		method: 'DELETE',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};