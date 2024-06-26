import { getToken } from '$lib/server/authentification';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { BACKEND_API_HOST, BACKEND_API_PORT } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies, fetch, params }) => {
	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/lists/${params.id}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application',
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};
export const DELETE: RequestHandler = async ({ cookies, fetch, params }) => {
	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/lists/${params.id}`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		}
	});
	return res;
};
