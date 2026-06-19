// src/routes/api/filesystem/general/+server.ts - Version corrigée

import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies, fetch, url }) => {
	try {
		// Ajouter un paramètre pour exclure les fichiers de projet
		const response = await fetch(`${API_URL}/filesystem/general?exclude_projects=true`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		if (response.ok) {
			const generalFiles = await response.json();

			// Filtrage côté frontend en cas de doute
			const filteredFiles = generalFiles.filter((file) => {
				// Exclure tout fichier ayant un projectId
				return !file.projectId && !file.pieceId;
			});

			return new Response(JSON.stringify(filteredFiles), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return response;
	} catch (error) {
		console.error('Error loading general files:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to load general files',
				details: error.message
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};
