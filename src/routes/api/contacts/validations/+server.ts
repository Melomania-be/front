import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { BACKEND_API_HOST, BACKEND_API_PORT } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies, url, fetch }) => {
	const page = url.searchParams.get('page');
	const limit = url.searchParams.get('limit');
	const filter = url.searchParams.get('filter');
	const orderBy = url.searchParams.get('orderBy');
	const order = url.searchParams.get('order');

	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/contact/validation?limit=${limit}&page=${page}&filter=${filter}&orderBy=${orderBy}&order=${order}`, {
		method: 'GET',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};
