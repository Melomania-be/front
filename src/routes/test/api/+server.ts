import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ cookies, request, fetch }) => {
	const data = await request.json();

	const res = await fetch(`${API_URL}/contact`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify(data)
	});

	return res;
};

export const GET: RequestHandler = async ({ cookies, fetch }) => {
	const res = await fetch(`${API_URL}/contact/filterable`, {
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};
