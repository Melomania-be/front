// src/routes/api/audition/[token]/+server.ts - Version corrigée

import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, fetch }) => {
	try {
		const res = await fetch(`${API_URL}/audition/${params.token}`, {
			method: 'GET'
		});

		return res;
	} catch (error) {
		console.error('Error fetching audition:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};

export const POST: RequestHandler = async ({ params, fetch, request }) => {
	try {
		console.log('API Route - Upload request for token:', params.token);

		// Récupérer le FormData de la requête
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

		// Faire la requête vers le backend en passant le FormData tel quel
		const res = await fetch(`${API_URL}/audition/${params.token}/upload`, {
			method: 'POST',
			body: formData
			// IMPORTANT: Ne pas définir Content-Type, laisser le navigateur le faire automatiquement
		});

		// Log de la réponse pour debug
		const responseText = await res.text();
		console.log('Backend response status:', res.status);
		console.log('Backend response:', responseText);

		// Retourner la réponse avec le bon content-type
		return new Response(responseText, {
			status: res.status,
			headers: {
				'Content-Type': 'application/json'
			}
		});

	} catch (error) {
		console.error('Error in API route:', error);
		return new Response(JSON.stringify({
			error: 'Internal server error',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};