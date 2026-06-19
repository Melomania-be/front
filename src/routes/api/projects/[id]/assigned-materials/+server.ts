// src/routes/api/projects/[id]/assigned-materials/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
	try {
		console.log('🔍 Getting assigned materials for project:', params.id);

		const res = await fetch(`${API_URL}/projects/${params.id}/assigned-materials`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		if (res.status === 404) {
			// Pas de matériels assignés - retourner un tableau vide
			console.log('📋 No assigned materials found for project:', params.id);
			return new Response(JSON.stringify([]), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return res;
	} catch (error) {
		console.error('Error fetching assigned materials:', error);
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
