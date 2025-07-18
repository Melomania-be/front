import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
	const res = await fetch(`${API_URL}/filesystem/projects/${params.id}`, {
		method: 'GET',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});
	return res;
};