import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { BACKEND_API_HOST, BACKEND_API_PORT } from '$env/static/private';

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
	const res = await fetch(
		`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/files/download/${params.id}`,
		{
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		}
	);

	return res;
};

export const DELETE: RequestHandler = async ({ params, cookies, fetch }) => {
	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/files/${params.id}`, {
		method: 'DELETE',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};
