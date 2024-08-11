import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const PUT: RequestHandler = async ({ cookies, fetch, request }) => {
	const data = await request.json();
	console.log(data);

	const res = await fetch(`${API_URL}/unsubscribe/`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify(await data)
	});

	return res;
};
