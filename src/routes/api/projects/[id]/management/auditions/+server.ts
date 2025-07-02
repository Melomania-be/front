// src/routes/api/projects/[id]/management/auditions/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
	const res = await fetch(`${API_URL}/projects/${params.id}/management/auditions`, {
		method: 'GET',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};

export const DELETE: RequestHandler = async ({ params, cookies, fetch, url }) => {
	try {
		// Récupérer l'ID de l'audition depuis les paramètres de requête
		const auditionId = url.searchParams.get('auditionId');

		if (!auditionId) {
			return new Response(JSON.stringify({
				error: 'Audition ID is required'
			}), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		console.log(`API Route: Deleting audition ${auditionId} from project ${params.id}`);

		const response = await fetch(`${API_URL}/projects/${params.id}/management/auditions/${auditionId}`, {
			method: 'DELETE',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		console.log(`Backend response status: ${response.status}`);

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