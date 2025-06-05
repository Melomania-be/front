import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies, request, fetch }) => {
	const res = await fetch(`${API_URL}/users`, {
		method: 'GET',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};

export const PUT: RequestHandler = async ({ cookies, request, fetch }) => {
	const data = await request.json();
	const res = await fetch(`${API_URL}/users/`, {
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

	const res = await fetch(`${API_URL}/users/${id}`, {
		method: 'DELETE',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};
