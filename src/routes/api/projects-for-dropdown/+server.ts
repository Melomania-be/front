// src/routes/api/projects-for-dropdown/+server.ts

import { getToken } from '$lib/server/authentification'; // Assuming you use this for auth
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private'; // Your backend URL from .env

const PROJECTS_API_ENDPOINT = `${API_URL}/projects-for-dropdown`;

export const GET: RequestHandler = async ({ cookies, fetch }) => {
	try {
		const res = await fetch(PROJECTS_API_ENDPOINT, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}` // Forward the auth token
			}
		});

		if (!res.ok) {
			// If the backend returns an error, forward it to the frontend
			console.error(
				`Backend GET ${PROJECTS_API_ENDPOINT} error (${res.status}):`,
				await res.text()
			);
			return new Response(await res.text(), {
				status: res.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const data = await res.json();
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Error in SvelteKit API route /api/projects-for-dropdown:', error);
		return new Response(JSON.stringify({ message: 'Internal Server Error fetching projects' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
