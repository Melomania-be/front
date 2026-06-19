// src/routes/api/pieces/[pieceId]/select-material/+server.ts - Version corrigée

import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ params, cookies, request, fetch }) => {
	try {
		const { materialId } = await request.json();
		const pieceId = params.pieceId;

		// Appel backend avec timeout et meilleure gestion d'erreur
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

		const response = await fetch(`${API_URL}/pieces/${pieceId}/select-material`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			},
			body: JSON.stringify({ materialId }),
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (response.ok) {
			// Vérifier que la réponse est du JSON valide
			const contentType = response.headers.get('content-type');
			if (!contentType || !contentType.includes('application/json')) {
				console.error('Response is not JSON:', contentType);
				return new Response(
					JSON.stringify({
						success: false,
						error: 'Invalid response format from backend'
					}),
					{
						status: 500,
						headers: { 'Content-Type': 'application/json' }
					}
				);
			}

			const result = await response.json();

			return new Response(JSON.stringify(result), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} else {
			const errorText = await response.text();
			console.error('Backend error selecting material:', errorText);

			return new Response(
				JSON.stringify({
					success: false,
					error: 'Backend error',
					details: errorText,
					status: response.status
				}),
				{
					status: response.status,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}
	} catch (error) {
		console.error('Error in material selection route:', error);

		if (error.name === 'AbortError') {
			return new Response(
				JSON.stringify({
					success: false,
					error: 'Request timeout',
					details: 'The request took too long to complete'
				}),
				{
					status: 408,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		return new Response(
			JSON.stringify({
				success: false,
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

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
	try {
		const pieceId = params.pieceId;

		// Appel backend avec timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 10000);

		const response = await fetch(`${API_URL}/pieces/${pieceId}/select-material`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			},
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (response.ok) {
			// Vérifier que la réponse est du JSON valide
			const contentType = response.headers.get('content-type');
			if (!contentType || !contentType.includes('application/json')) {
				console.error('Response is not JSON:', contentType);
				return new Response(
					JSON.stringify({
						materialId: null,
						error: 'Invalid response format'
					}),
					{
						status: 200,
						headers: { 'Content-Type': 'application/json' }
					}
				);
			}

			const result = await response.json();

			return new Response(JSON.stringify(result), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} else {
			return new Response(JSON.stringify({ materialId: null }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	} catch (error) {
		console.error('Error getting material selection:', error);

		if (error.name === 'AbortError') {
			return new Response(
				JSON.stringify({
					materialId: null,
					error: 'Request timeout'
				}),
				{
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		return new Response(
			JSON.stringify({
				materialId: null,
				error: error.message
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};
