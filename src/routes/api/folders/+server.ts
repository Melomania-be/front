import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { BACKEND_API_HOST, BACKEND_API_PORT } from '$env/static/private';

export const PUT: RequestHandler = async ({ cookies, request, fetch }) => {
	const { name } = await request.json();

	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/folders`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify({ name })
	});

	return res;
};

export const GET: RequestHandler = async ({ cookies, fetch }) => {
	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/folders`, {
		method: 'GET',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};

export const PATCH: RequestHandler = async ({ cookies, request, fetch }) => {
	const data = await request.json();

	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/folders`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify(await data)
	});

	return res;
};
