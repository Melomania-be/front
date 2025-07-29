
// src/routes/api/pieces/all/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies, fetch }) => {
	try {
		// Utiliser votre structure API existante avec une limite élevée
		const res = await fetch(
			`${API_URL}/piece?limit=10000&page=1&filter=&orderBy=name&order=asc`,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					authorization: `${await getToken(cookies)}`
				}
			}
		);

		if (res.ok) {
			const data = await res.json();
			// Adapter la structure de réponse
			const pieces = data.data || data || [];
			return new Response(JSON.stringify(pieces), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return res;
	} catch (error) {
		console.error('Error in pieces/all GET route:', error);
		return new Response(JSON.stringify({
			error: 'Internal server error',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};