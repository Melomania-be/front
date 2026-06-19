import { API_URL } from '$env/static/private';
import { getToken } from '$lib/server/authentification';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, fetch, cookies }) => {
	const res = await fetch(`${API_URL}/accountings/${params.contactId}`, {
		method: 'GET',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};
