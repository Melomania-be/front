// src/routes/api/users/current/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies, fetch }) => {
	try {
		const res = await fetch(`${API_URL}/users/current`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		return res;
	} catch (error) {
		return new Response(
			JSON.stringify({
				error: 'Failed to get current user',
				fullName: 'Utilisateur actuel'
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};
