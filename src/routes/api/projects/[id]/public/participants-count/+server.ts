import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';
import { getToken } from '$lib/server/authentification';

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
	const token = await getToken(cookies);

	const res = await fetch(`${API_URL}/projects/${params.id}/public/participants-count`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			authorization: token ?? ''
		}
	});

	return res;
};