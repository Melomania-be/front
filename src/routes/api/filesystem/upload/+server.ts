import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ cookies, request, fetch }) => {
	const data = await request.formData();

	const res = await fetch(`${API_URL}/filesystem/upload`, {
		method: 'POST',
		headers: {
			authorization: `${await getToken(cookies)}`
		},
		body: data
	});

	return res;
};
