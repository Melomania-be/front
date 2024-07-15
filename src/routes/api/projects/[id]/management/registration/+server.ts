import { BACKEND_API_HOST, BACKEND_API_PORT } from '$env/static/private';
import { getToken } from '$lib/server/authentification';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies, fetch, params, request }) => {
	const data = await request.json();

	const res = await fetch(
		`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/projects/${params.id}/management/registration`,
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

export const DELETE: RequestHandler = async ({ cookies, fetch, params }) => {
	const res = await fetch(
		`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/projects/${params.id}/management/registration`,
		{
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			}
		}
	);

	return res;
};
