// src/routes/api/projects/[id]/sync-material-selections/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ params, cookies, fetch }) => {
	try {
		console.log('🔄 Syncing material selections for project:', params.id);

		const response = await fetch(`${API_URL}/projects/${params.id}/sync-material-selections`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			}
		});

		if (response.ok) {
			const result = await response.json();
			console.log('✅ Material selections synced:', result);
		}

		return response;
	} catch (error) {
		console.error('❌ Error syncing material selections:', error);
		return new Response(JSON.stringify({
			success: false,
			error: 'Sync failed',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};