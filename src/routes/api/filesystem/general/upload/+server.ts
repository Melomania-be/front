// src/routes/api/filesystem/general/upload/+server.ts - Nouvelle route

import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ cookies, request, fetch }) => {
	try {
		const data = await request.formData();

		// S'assurer qu'aucun projectId n'est envoyé
		data.delete('projectId');
		data.delete('pieceId');

		// Marquer explicitement comme fichier général
		data.append('is_general', 'true');

		const response = await fetch(`${API_URL}/filesystem/upload-general`, {
			method: 'POST',
			headers: {
				authorization: `${await getToken(cookies)}`
			},
			body: data
		});

		const result = await response.json();

		if (!response.ok) {
			console.error('General file upload failed:', result.error);
		}

		return response;
	} catch (error) {
		console.error('Error in general upload:', error);
		return new Response(
			JSON.stringify({
				error: 'Upload failed',
				details: error.message
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};
