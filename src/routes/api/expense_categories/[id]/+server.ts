import { API_URL } from '$env/static/private';
import { getToken } from '$lib/server/authentification';
import type { RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ cookies, params, fetch }) => {
	try {
		const res = await fetch(`${API_URL}/expense_categories/${params.id}`, {
			method: 'DELETE',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		if (!res.ok) {
			console.error('Backend error:', res.status, res.statusText);
		}

		return res;
	} catch (error) {
		console.error('API route error:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
