// Dans src/routes/api/filesystem/folders/[id]/stats/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
	try {
		// Cette route retournerait les statistiques d'un dossier
		const response = await fetch(`${API_URL}/filesystem/folders/${params.id}/stats`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		if (response.ok) {
			const stats = await response.json();
			return new Response(JSON.stringify(stats), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return response;
	} catch (error) {
		console.error('Error fetching folder stats:', error);
		return new Response(JSON.stringify({ error: 'Failed to fetch folder stats' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};