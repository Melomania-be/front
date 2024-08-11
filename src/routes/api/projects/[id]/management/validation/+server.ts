import { API_URL } from '$env/static/private';
import { getToken } from '$lib/server/authentification';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params, fetch }) => {
	const id = params.id;

	const response = await fetch(
		`${API_URL}/projects/${id}/management/validation`,
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			}
		}
	);

	return response;
};

export const POST: RequestHandler = async ({ cookies, fetch, params, request }) => {
	const data = await request.json();

	const res = await fetch(
		`${API_URL}/projects/${params.id}/management/validation`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			},
			body: JSON.stringify(data)
		}
	);

	return res;
};
