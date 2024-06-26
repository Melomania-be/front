import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { BACKEND_API_HOST, BACKEND_API_PORT } from '$env/static/private';

export const POST: RequestHandler = async ({ cookies, request, fetch }) => {
	const data = { name: 'test' };

	console.log(data);

	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/type_of_pieces`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify(data)
	});

	console.log(res);

	return res;
};
