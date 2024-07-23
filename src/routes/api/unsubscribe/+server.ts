import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { BACKEND_API_HOST, BACKEND_API_PORT } from '$env/static/private';

export const PUT: RequestHandler = async ({ cookies, fetch, request }) => {
	const data = await request.json();
	console.log(data);

	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/unsubscribe/`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify(await data)
	});

	return res;
};
