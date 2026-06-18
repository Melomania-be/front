// src/routes/api/audition/[token]/upload/+server.ts
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ params, fetch, request }) => {
	try {
		console.log('API Route - Upload request for token:', params.token);

		// Récupérer les données FormData de la requête
		const formData = await request.formData();

		// Log pour debug
		console.log('FormData entries:');
		for (const [key, value] of formData.entries()) {
			if (value instanceof File) {
				console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
			} else {
				console.log(`${key}: ${value}`);
			}
		}

		// Faire la requête vers le backend avec FormData
		const res = await fetch(`${API_URL}/audition/${params.token}/upload`, {
			method: 'POST',
			body: formData // Passer directement FormData, pas besoin de headers Content-Type
		});

		// Log de la réponse pour debug
		const responseText = await res.text();
		console.log('Backend upload response status:', res.status);
		console.log('Backend upload response:', responseText);

		// Retourner la réponse avec le bon content-type
		return new Response(responseText, {
			status: res.status,
			headers: {
				'Content-Type': 'application/json'
			}
		});

	} catch (error) {
		console.error('Error in upload API route:', error);
		return new Response(JSON.stringify({
			error: 'Internal server error',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};