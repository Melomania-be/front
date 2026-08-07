import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ fetch }) => {
	const res = await fetch(`${API_URL}/app_settings`, { method: 'GET' });
	return res;
};

export const PUT: RequestHandler = async ({ cookies, request, fetch }) => {
	const data = await request.formData();
	const res = await fetch(`${API_URL}/app_settings`, {
		method: 'PUT',
		headers: { authorization: `${await getToken(cookies)}` },
		body: data
	});
	return res;
};
