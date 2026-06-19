// src/routes/api/materials/+server.ts - Extension de votre API matériels
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies, fetch, url }) => {
	try {
		const search = url.searchParams.get('search') || '';
		const pieceId = url.searchParams.get('pieceId') || '';

		// Construire la requête vers votre API backend
		const queryParams = new URLSearchParams();
		if (search) queryParams.set('search', search);
		if (pieceId) queryParams.set('pieceId', pieceId);
		queryParams.set('limit', '1000');
		queryParams.set('page', '1');

		const res = await fetch(`${API_URL}/materials?${queryParams.toString()}`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		return res;
	} catch (error) {
		console.error('Error in materials GET route:', error);
		return new Response(
			JSON.stringify({
				error: 'Internal server error',
				details: error.message
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};

export const POST: RequestHandler = async ({ cookies, request, fetch }) => {
	const data = await request.json();

	const res = await fetch(`${API_URL}/materials`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify(data)
	});

	return res;
};
