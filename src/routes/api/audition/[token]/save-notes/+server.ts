// src/routes/api/audition/[token]/save-notes/+server.ts
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ params, fetch, request }) => {
	try {
		console.log('API Route - Save notes request for token:', params.token);

		// Récupérer les données JSON de la requête
		const data = await request.json();

		console.log('Notes data:', data);

		// Faire la requête vers le backend
		const res = await fetch(`${API_URL}/audition/${params.token}/save-notes`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});

		// Log de la réponse pour debug
		const responseText = await res.text();
		console.log('Backend save-notes response status:', res.status);
		console.log('Backend save-notes response:', responseText);

		// Retourner la réponse avec le bon content-type
		return new Response(responseText, {
			status: res.status,
			headers: {
				'Content-Type': 'application/json'
			}
		});

	} catch (error) {
		console.error('Error in save-notes API route:', error);
		return new Response(JSON.stringify({
			error: 'Internal server error',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};