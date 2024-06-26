import { getToken } from '$lib/server/authentification';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { BACKEND_API_HOST, BACKEND_API_PORT } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies, fetch }) => {
	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/piece`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application',
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};

export const PUT: RequestHandler = async ({ cookies, fetch, request }) => {
	const piece = await request.json();

	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/piece/`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify(piece)
	});
	return res;
};

export const DELETE: RequestHandler = async ({ cookies, fetch, request }) => {
	const { id } = await request.json();

	await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/piece/${id}`, {
		method: 'DELETE',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});
	return new Response();
};
