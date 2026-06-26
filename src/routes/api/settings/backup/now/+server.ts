import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ cookies, fetch }) => {
	const res = await fetch(`${API_URL}/settings/backup/now`, {
		method: 'POST',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};