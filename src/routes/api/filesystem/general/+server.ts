// src/routes/api/filesystem/general/+server.ts - VERSION CORRIGÉE

import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies, fetch, url }) => {
	try {
		console.log('🔍 Loading ONLY general files (not project files)');

		// ✅ CORRECTION : Ajouter un paramètre pour exclure les fichiers de projet
		const response = await fetch(`${API_URL}/filesystem/general?exclude_projects=true`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		if (response.ok) {
			const generalFiles = await response.json();
			console.log(`✅ Loaded ${generalFiles.length} general files (project files excluded)`);

			// ✅ FILTRAGE CÔTÉ FRONTEND en cas de doute
			const filteredFiles = generalFiles.filter(file => {
				// Exclure tout fichier ayant un projectId
				return !file.projectId && !file.pieceId;
			});

			console.log(`🔍 After filtering: ${filteredFiles.length} truly general files`);

			return new Response(JSON.stringify(filteredFiles), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return response;
	} catch (error) {
		console.error('❌ Error loading general files:', error);
		return new Response(JSON.stringify({
			error: 'Failed to load general files',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
