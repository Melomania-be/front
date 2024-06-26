import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { BACKEND_API_HOST, BACKEND_API_PORT } from '$env/static/private';

export const POST: RequestHandler = async ({ cookies, request, fetch }) => {
	const data = await request.formData();

	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/files`, {
		method: 'POST',
		headers: {
			authorization: `${await getToken(cookies)}`
		},
		body: data
	});

	return res;
};

export const GET: RequestHandler = async ({ cookies, fetch }) => {
	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/files`, {
		method: 'GET',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};
