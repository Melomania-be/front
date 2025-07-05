// src/routes/api/auth/me/+server.ts

import { getToken } from '$lib/server/authentification'; // Assuming this utility exists
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private'; // Make sure API_URL includes your backend's base URL (e.g., http://localhost:3333)

// Define the backend endpoint for fetching current user details
const ME_API_ENDPOINT = `${API_URL}/auth/me`; // Matches your AdonisJS backend route

export const GET: RequestHandler = async ({ cookies, fetch }) => {
    try {
        const token = await getToken(cookies); // Get the authentication token from cookies

        // Make the request to your backend's /auth/me endpoint
        const res = await fetch(ME_API_ENDPOINT, {
            method: 'GET',
            headers: {
                // Include the Authorization header with the Bearer token
                Authorization: `${token}` // getToken should return "Bearer <token>" or similar
                                         // If getToken returns just the token, you might need: `Authorization: `Bearer ${token}``
            }
        });

        // Clone the response for logging if needed, then return the original
        if (!res.ok) {
            const errorText = await res.text();
            console.error(`Backend /auth/me error (${res.status}):`, errorText);
            // Return a new Response to propagate the error details to the frontend
            return new Response(errorText, { status: res.status, headers: res.headers });
        }

        // Return the backend's response directly to the frontend
        return res;
    } catch (error) {
        console.error('Error in SvelteKit /api/auth/me proxy:', error);
        // Handle unexpected errors during the proxy request itself
        return new Response('Failed to fetch current user details due to an internal server error.', { status: 500 });
    }
};