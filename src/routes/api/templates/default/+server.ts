import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies, url, fetch }) => {
	const res = await fetch(
		`${API_URL}/mailing/templates/default`,
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application',
				authorization: `${await getToken(cookies)}`
			}
		}
	);

	console.log(res);
	return res;
};

export const PUT: RequestHandler = async ({ cookies, fetch, request }) => {
	const data = await request.json();

	const res = await fetch(
		`${API_URL}/mailing/templates/default/edit`,
		{
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			},
			body: JSON.stringify(await data)
		}
	);

	return res;
};
