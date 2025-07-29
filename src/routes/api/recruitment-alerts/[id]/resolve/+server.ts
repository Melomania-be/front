// src/routes/api/recruitment-alerts/[id]/resolve/+server.ts

import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private'; // Your backend URL from .env

const BACKEND_ALERTS_ENDPOINT = `${API_URL}/recruitment-alerts`;

export const PATCH: RequestHandler = async ({ cookies, fetch, params }) => {
	try {
		const alertId = params.id; // Get the ID from the URL parameter

		const res = await fetch(`${BACKEND_ALERTS_ENDPOINT}/${alertId}/resolve`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json', // Even if no body, good practice
				authorization: `${await getToken(cookies)}` // Forward the auth token
			}
			// No body needed for this PATCH request as per your backend controller
		});

		if (!res.ok) {
			// If the backend returns an error, forward it to the frontend
			console.error(
				`Backend PATCH ${BACKEND_ALERTS_ENDPOINT}/${alertId}/resolve error (${res.status}):`,
				await res.text()
			);
			return new Response(await res.text(), {
				status: res.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Return the backend's response (e.g., success message)
		return new Response(JSON.stringify(await res.json()), {
			status: res.status, // Often 200 OK
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error(`Error in SvelteKit API route /api/recruitment-alerts/[id]/resolve:`, error);
		return new Response(JSON.stringify({ message: 'Internal Server Error resolving alert.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
