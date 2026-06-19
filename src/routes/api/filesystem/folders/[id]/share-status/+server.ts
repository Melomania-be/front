// src/routes/api/filesystem/folders/[id]/share-status/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
	try {
		const response = await fetch(`${API_URL}/filesystem/folders/${params.id}/share-status`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		if (response.ok) {
			const data = await response.json();
			return new Response(JSON.stringify(data), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Return default not shared status if endpoint not found
		return new Response(JSON.stringify({ isShared: false }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		// Return default not shared status on error
		return new Response(JSON.stringify({ isShared: false }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
