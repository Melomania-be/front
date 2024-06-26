import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { BACKEND_API_HOST, BACKEND_API_PORT } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies, request, fetch }) => {
	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/users`, {
		method: 'GET',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};

export const PUT: RequestHandler = async ({ cookies, request, fetch }) => {
	const data = await request.json();

	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/users/`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify(data)
	});

	return res;
};

export const DELETE: RequestHandler = async ({ cookies, request, fetch }) => {
	const { id } = await request.json();

	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/users/${id}`, {
		method: 'DELETE',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};
