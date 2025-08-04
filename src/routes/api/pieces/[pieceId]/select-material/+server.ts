// src/routes/api/pieces/[pieceId]/select-material/+server.ts - VERSION CORRIGÉE

import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ params, cookies, request, fetch }) => {
	try {
		const { materialId } = await request.json();
		const pieceId = params.pieceId;

		console.log(`🎯 Frontend: Selecting material ${materialId} for piece ${pieceId}`);

		// ✅ APPEL BACKEND avec timeout et meilleure gestion d'erreur
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
			// ✅ VÉRIFIER que la réponse est du JSON valide
			const contentType = response.headers.get('content-type');
			if (!contentType || !contentType.includes('application/json')) {
				console.error('❌ Frontend: Response is not JSON:', contentType);
				return new Response(JSON.stringify({
					success: false,
					error: 'Invalid response format from backend'
				}), {
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				});
			}

			const result = await response.json();
			console.log('✅ Frontend: Material selection saved successfully');

			return new Response(JSON.stringify(result), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} else {
			const errorText = await response.text();
			console.error('❌ Frontend: Backend error selecting material:', errorText);

			return new Response(JSON.stringify({
				success: false,
				error: 'Backend error',
				details: errorText,
				status: response.status
			}), {
				status: response.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

	} catch (error) {
		console.error('❌ Frontend: Error in material selection route:', error);

		if (error.name === 'AbortError') {
			return new Response(JSON.stringify({
				success: false,
				error: 'Request timeout',
				details: 'The request took too long to complete'
			}), {
				status: 408,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return new Response(JSON.stringify({
			success: false,
			error: 'Internal server error',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
	try {
		const pieceId = params.pieceId;

		console.log(`🔍 Frontend: Getting selected material for piece ${pieceId}`);

		// ✅ APPEL BACKEND avec timeout
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
			// ✅ VÉRIFIER que la réponse est du JSON valide
			const contentType = response.headers.get('content-type');
			if (!contentType || !contentType.includes('application/json')) {
				console.error('❌ Frontend: Response is not JSON:', contentType);
				return new Response(JSON.stringify({
					materialId: null,
					error: 'Invalid response format'
				}), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			}

			const result = await response.json();
			console.log(`✅ Frontend: Retrieved material selection: ${result.materialId}`);

			return new Response(JSON.stringify(result), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		} else {
			console.warn(`⚠️ Frontend: No selection found for piece ${pieceId} (${response.status})`);
			return new Response(JSON.stringify({ materialId: null }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

	} catch (error) {
		console.error('❌ Frontend: Error getting material selection:', error);

		if (error.name === 'AbortError') {
			return new Response(JSON.stringify({
				materialId: null,
				error: 'Request timeout'
			}), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return new Response(JSON.stringify({
			materialId: null,
			error: error.message
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
