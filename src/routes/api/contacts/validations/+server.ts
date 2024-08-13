import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies, url, fetch }) => {
	const page = url.searchParams.get('page');
	const limit = url.searchParams.get('limit');
	const filter = url.searchParams.get('filter');
	const orderBy = url.searchParams.get('orderBy');
	const order = url.searchParams.get('order');

	const res = await fetch(
		`${API_URL}/contact/validation?limit=${limit}&page=${page}&filter=${filter}&orderBy=${orderBy}&order=${order}`,
		{
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		}
	);

	return res;
};

export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
	const data = await request.json();

	console.log(data);

	const res = await fetch(`${API_URL}/contact/validation/merge`, {
		method: 'POST',
		headers: {
			authorization: `${await getToken(cookies)}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	});

	return res;
};
