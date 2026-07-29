import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ fetch }) => {
	const res = await fetch(`${API_URL}/app_settings/logo`, { method: 'GET' });
	return res;
};

export const DELETE: RequestHandler = async ({ cookies, fetch }) => {
	const res = await fetch(`${API_URL}/app_settings/logo`, {
		method: 'DELETE',
		headers: { authorization: `${await getToken(cookies)}` }
	});
	return res;
};
