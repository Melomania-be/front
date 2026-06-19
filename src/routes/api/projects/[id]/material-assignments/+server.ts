// src/routes/api/projects/[id]/material-assignments/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
	try {
		console.log('🔍 Getting material assignments for project:', params.id);

		const res = await fetch(`${API_URL}/projects/${params.id}/material-assignments`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		if (res.status === 404) {
			// Pas d'assignations trouvées - retourner un tableau vide
			console.log('📋 No assignments found for project:', params.id);
			return new Response(JSON.stringify([]), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return res;
	} catch (error) {
		console.error('Error fetching material assignments:', error);
		return new Response(
			JSON.stringify({
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

export const POST: RequestHandler = async ({ params, cookies, request, fetch }) => {
	try {
		const data = await request.json();
		console.log('💾 Saving material assignments for project:', params.id);
		console.log('📊 Assignments data:', data);

		const res = await fetch(`${API_URL}/projects/${params.id}/material-assignments`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			},
			body: JSON.stringify(data)
		});

		if (res.ok) {
			const result = await res.json();
			console.log('✅ Assignments saved successfully');
			return new Response(JSON.stringify(result), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return res;
	} catch (error) {
		console.error('Error saving material assignments:', error);
		return new Response(
			JSON.stringify({
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
