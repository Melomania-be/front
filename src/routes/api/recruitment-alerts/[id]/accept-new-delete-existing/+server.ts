// src/routes/api/recruitment-alerts/[id]/accept-new-delete-existing/+server.ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { API_URL } from '$env/static/private';
import { getToken } from '$lib/server/authentification';

const BACKEND_ENDPOINT_BASE = `${API_URL}/recruitment-alerts`;

/**
 * Handles POST requests to resolve a recruitment alert by accepting the new recruit
 * and deleting the similar existing one.
 */
export const POST: RequestHandler = async ({ params, request, cookies, fetch }) => {
	const { id } = params;

	if (!id) {
		throw error(400, 'Recruitment alert ID is required.');
	}

	try {
		const backendEndpoint = `${BACKEND_ENDPOINT_BASE}/${id}/accept-new-delete-existing`;

		const authToken = await getToken(cookies);
		if (!authToken) {
			throw error(401, 'Authentication required.');
		}

		const res = await fetch(backendEndpoint, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `${authToken}`
			},
			// Assuming your backend action doesn't require a body for this specific resolution POST,
			// but if it did, it would be: body: request.body
			body: request.body // Keep this if your AdonisJS endpoint expects a body
		});

		if (res.ok) {
			const responseBody = res.status === 204 ? {} : await res.json();
			return json(responseBody, { status: res.status });
		} else {
			// --- IMPORTANT CHANGE HERE: Robust Error Parsing ---
			let errorMessage = 'Failed to resolve recruitment alert.'; // Default error message
			try {
				const errorData = await res.json(); // Try to parse as JSON first
				if (errorData && typeof errorData.message === 'string') {
					errorMessage = errorData.message; // Use message from JSON if available
				} else {
					// Fallback if JSON is malformed or message field is missing
					errorMessage = await res.text(); // Get raw text if JSON parsing yields nothing useful
				}
			} catch (jsonParseError) {
				// If it's not valid JSON, just get the raw text
				errorMessage = await res.text();
			}
			// --- END IMPORTANT CHANGE ---

			console.error(
				`Backend POST ${backendEndpoint} error (${res.status}):`,
				errorMessage // Log the extracted message for clarity
			);
			throw error(res.status, errorMessage); // Throw SvelteKit error with a plain string message
		}
	} catch (err: any) {
		console.error('Error in SvelteKit API route for accept-new-delete-existing:', err);
		// Ensure the message passed to SvelteKit's `error` is a string
		throw error(
			err.status || 500,
			typeof err.message === 'string'
				? err.message
				: 'Internal server error processing the alert resolution.'
		);
	}
};
