// src/routes/api/projects/[id]/pieces/+server.ts - Route pour les pièces d'un projet SANS matériels pré-assignés
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
	try {
		console.log('🔄 Fetching pieces for NEW project (no pre-assignments):', params.id);

		const res = await fetch(`${API_URL}/projects/${params.id}/pieces-clean`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		if (res.ok) {
			const pieces = await res.json();
			console.log(`✅ Loaded ${pieces.length} pieces without pre-assignments`);

			// S'assurer qu'aucun matériel n'est pré-assigné
			const cleanPieces = pieces.map(piece => ({
				...piece,
				pivot_material_id: null,
				pivot_material_specified: false
			}));

			return new Response(JSON.stringify(cleanPieces), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return res;
	} catch (error) {
		console.error('Error in project pieces route:', error);
		return new Response(JSON.stringify({
			error: 'Internal server error',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};