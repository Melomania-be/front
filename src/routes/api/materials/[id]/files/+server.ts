// src/routes/api/materials/[id]/files/+server.ts - Solution définitive
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
	try {
		// 1. Essayer d'abord la route dédiée files
		const filesRes = await fetch(`${API_URL}/materials/${params.id}/files`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		if (filesRes.ok) {
			const files = await filesRes.json();
			return filesRes;
		}

		// 2. Si pas de route dédiée, récupérer depuis le matériel complet
		const materialRes = await fetch(`${API_URL}/materials/${params.id}`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		if (materialRes.ok) {
			const material = await materialRes.json();
			const files = material.files || [];

			// S'assurer que chaque fichier a les bonnes propriétés
			const processedFiles = files.map((file) => ({
				id: file.id,
				name: file.name || file.filename,
				size: file.size || 0,
				type: file.type || file.mime_type || '',
				path: file.path || '',
				instrument_part: file.instrument_part || null,
				createdAt: file.createdAt || file.created_at,
				updatedAt: file.updatedAt || file.updated_at,
				...file
			}));

			return new Response(JSON.stringify(processedFiles), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// 3. Fallback final
		return new Response(JSON.stringify([]), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error(`Error loading files for material ${params.id}:`, error);
		return new Response(JSON.stringify([]), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};

export const POST: RequestHandler = async ({ params, cookies, request, fetch }) => {
	try {
		const formData = await request.formData();

		const res = await fetch(`${API_URL}/materials/${params.id}/files`, {
			method: 'POST',
			headers: {
				authorization: `${await getToken(cookies)}`
			},
			body: formData
		});

		if (!res.ok) {
			const errorText = await res.text();
			console.error(`Upload failed for material ${params.id}:`, errorText);
		}

		return res;
	} catch (error) {
		console.error(`Upload error for material ${params.id}:`, error);
		return new Response(
			JSON.stringify({
				success: false,
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
