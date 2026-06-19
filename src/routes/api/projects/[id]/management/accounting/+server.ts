import { API_URL } from '$env/static/private';
import { getToken } from '$lib/server/authentification';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, url, fetch, params }) => {
	const res = await fetch(`${API_URL}/projects/${params.id}/management/accounting`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		}
	});
	return res;
};

export const POST: RequestHandler = async ({ cookies, request, params, fetch }) => {
	const body = await request.json();

	const res = await fetch(`${API_URL}/projects/${params.id}/management/accounting`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify(body)
	});

	return res;
};
