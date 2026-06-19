// src/routes/api/projects/[id]/material-selections/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
	try {
		console.log('🔍 Getting material selections for project:', params.id);

		const response = await fetch(`${API_URL}/projects/${params.id}/material-selections`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		return response;
	} catch (error) {
		console.error('❌ Error getting material selections:', error);
		return new Response(JSON.stringify([]), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
