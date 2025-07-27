// src/routes/api/pieces/[pieceId]/select-material/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ params, cookies, request, fetch }) => {
	try {
		const { materialId } = await request.json();

		console.log(`🎵 Selecting material ${materialId} for piece ${params.pieceId}`);

		const res = await fetch(`${API_URL}/pieces/${params.pieceId}/select-material`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			},
			body: JSON.stringify({ materialId })
		});

		return res;
	} catch (error) {
		console.error('Error selecting material for piece:', error);
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
		console.log(`🔍 Getting selected material for piece ${params.pieceId}`);

		const res = await fetch(`${API_URL}/pieces/${params.pieceId}/selected-material`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		return res;
	} catch (error) {
		console.error('Error getting selected material for piece:', error);
		return new Response(JSON.stringify({
			error: 'Internal server error',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};