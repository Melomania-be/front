// src/routes/api/files/[id]/+server.ts - Version corrigée avec DELETE
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
	const res = await fetch(
		`${API_URL}/files/download/${params.id}`,
		{
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		}
	);

	return res;
};

// ✅ FIXED: Ajout de la route DELETE manquante
export const DELETE: RequestHandler = async ({ params, cookies, fetch }) => {
	try {
		console.log('🗑️ API Route - Deleting file:', params.id);

		const res = await fetch(`${API_URL}/files/${params.id}`, {
			method: 'DELETE',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		console.log('🗑️ Backend response status:', res.status);

		if (res.ok) {
			console.log('✅ File deleted successfully');
		} else {
			console.error('❌ Delete failed:', res.status);
		}

		return res;
	} catch (error) {
		console.error('❌ Error in delete API route:', error);
		return new Response(JSON.stringify({
			error: 'Delete error',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};

export const PUT: RequestHandler = async ({ params, cookies, request, fetch }) => {
	const { name } = await request.json();

	if (!name) {
		return new Response(JSON.stringify({ message: 'New name is required' }), { status: 400 });
	}

	const res = await fetch(`${API_URL}/files/${params.id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify({ name })
	});

	return res;
};