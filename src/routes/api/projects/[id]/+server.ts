import { API_URL } from '$env/static/private';
import { getToken } from '$lib/server/authentification';
import type { RequestHandler } from '@sveltejs/kit';

export const PUT: RequestHandler = async ({ cookies, request, params }) => {
	const token = await getToken(cookies);
	const body = await request.json();

	const response = await fetch(`${API_URL}/tasks/${params.id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${token}`
		},
		body: JSON.stringify(body)
	});

	const data = await response.json();
	return new Response(JSON.stringify(data), {
		status: response.status,
		headers: { 'Content-Type': 'application/json' }
	});
};

export const DELETE: RequestHandler = async ({ cookies, params }) => {
	const token = await getToken(cookies);

	const response = await fetch(`${API_URL}/tasks/${params.id}`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${token}`
		}
	});

	return new Response(null, { status: response.status });
};