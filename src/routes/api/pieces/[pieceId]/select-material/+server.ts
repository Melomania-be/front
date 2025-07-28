// src/routes/api/pieces/[pieceId]/select-material/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

// Stockage temporaire en mémoire
const materialSelections = new Map<string, number | null>();

export const POST: RequestHandler = async ({ params, cookies, request, fetch }) => {
	try {
		const { materialId } = await request.json();
		const pieceId = params.pieceId;

		// Essayer d'abord le backend
		try {
			const res = await fetch(`${API_URL}/pieces/${pieceId}/select-material`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					authorization: `${await getToken(cookies)}`
				},
				body: JSON.stringify({ materialId })
			});

			if (res.ok) {
				return res;
			}
		} catch (backendError) {
			// Backend non disponible, utiliser le fallback
		}

		// Fallback : stockage en mémoire
		materialSelections.set(pieceId, materialId);

		return new Response(JSON.stringify({
			success: true,
			materialId: materialId,
			message: 'Material selected successfully (fallback storage)'
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});

	} catch (error) {
		return new Response(JSON.stringify({
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

		// Essayer d'abord le backend
		try {
			const res = await fetch(`${API_URL}/pieces/${pieceId}/selected-material`, {
				method: 'GET',
				headers: {
					authorization: `${await getToken(cookies)}`
				}
			});

			if (res.ok) {
				return res;
			}
		} catch (backendError) {
			// Backend non disponible, utiliser le fallback
		}

		// Fallback : récupérer depuis le stockage en mémoire
		const materialId = materialSelections.get(pieceId) || null;

		return new Response(JSON.stringify({
			materialId: materialId
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});

	} catch (error) {
		return new Response(JSON.stringify({
			error: 'Internal server error',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};