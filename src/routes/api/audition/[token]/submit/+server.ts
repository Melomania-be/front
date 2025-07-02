// src/routes/api/audition/[token]/submit/+server.ts
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ params, fetch, request }) => {
	const data = await request.json();

	const res = await fetch(`${API_URL}/audition/${params.token}/submit`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	});

	return res;
};