// src/routes/api/recruitment/copy-to-project/+server.ts

import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private'; // Your backend URL from .env

const BACKEND_COPY_ENDPOINT = `${API_URL}/recruitments/copy-to-project`;

export const POST: RequestHandler = async ({ cookies, fetch, request }) => {
	try {
		const requestBody = await request.json(); // Get the JSON body from the SvelteKit frontend

		const res = await fetch(BACKEND_COPY_ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}` // Forward the auth token
			},
			body: JSON.stringify(requestBody) // Forward the body to the AdonisJS backend
		});

		if (!res.ok) {
			// If the backend returns an error, forward it to the frontend
			console.error(
				`Backend POST ${BACKEND_COPY_ENDPOINT} error (${res.status}):`,
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
		console.error('Error in SvelteKit API route /api/recruitment/copy-to-project:', error);
		return new Response(JSON.stringify({ message: 'Internal Server Error copying recruitments' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
