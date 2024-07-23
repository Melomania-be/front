import { BACKEND_API_HOST, BACKEND_API_PORT } from '$env/static/private';
import { getToken } from '$lib/server/authentification';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, url, fetch, params }) => {
	const page = url.searchParams.get('page');
	const limit = url.searchParams.get('limit');
	const filter = url.searchParams.get('filter');
	const orderBy = url.searchParams.get('orderBy');
	const order = url.searchParams.get('order');

	const res = await fetch(
		`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/projects/${params.id}/management/participants?limit=${limit}&page=${page}&filter=${filter}&orderBy=${orderBy}&order=${order}`,
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application',
				authorization: `${await getToken(cookies)}`
			}
		}
	);

	return res;
};

export const POST: RequestHandler = async ({ request, cookies, params }) => {
	const data = await request.json();

	console.log('data', data);

	const res = await fetch(
		`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/projects/${params.id}/management/participants`,
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
