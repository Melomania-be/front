// src/routes/api/projects/[id]/management/auditions/[auditionId]/+server.ts
import { type RequestHandler } from '@sveltejs/kit';
import { getToken } from '$lib/server/authentification';
import { API_URL } from '$env/static/private';

export const DELETE: RequestHandler = async ({ params, cookies, fetch }) => {
	try {
		console.log(`API Route: Deleting audition ${params.auditionId} from project ${params.id}`);

		const response = await fetch(`${API_URL}/projects/${params.id}/management/auditions/${params.auditionId}`, {
			method: 'DELETE',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		// Log pour debugging
		console.log(`Backend response status: ${response.status}`);

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`Backend error: ${errorText}`);
		}

		return response;
	} catch (error) {
		console.error('Error in delete audition API route:', error);
		return new Response(JSON.stringify({
			error: 'Internal server error',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};