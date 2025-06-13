// src/routes/api/audition/[token]/+server.ts
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, fetch }) => {
	const res = await fetch(`${API_URL}/audition/${params.token}`, {
		method: 'GET'
	});

	return res;
};

export const POST: RequestHandler = async ({ params, fetch, request }) => {
	const data = await request.formData();

	const res = await fetch(`${API_URL}/audition/${params.token}/upload`, {
		method: 'POST',
		body: data
	});

	return res;
};