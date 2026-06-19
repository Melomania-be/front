// src/routes/api/projects/[id]/recommend/+server.ts (route publique)
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ params, request, fetch }) => {
	const data = await request.json();

	const res = await fetch(`${API_URL}/projects/${params.id}/recommend`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	});

	return res;
};
