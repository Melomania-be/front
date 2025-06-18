// import { getToken } from '$lib/server/authentification';
// import { type RequestHandler } from '@sveltejs/kit';
// import { API_URL } from '$env/static/private';

// export const GET: RequestHandler = async ({ cookies, fetch }) => {
// 	const res = await fetch(`${API_URL}/recruitment`, {
// 		method: 'GET',
// 		headers: {
// 			authorization: `${await getToken(cookies)}`
// 		}
// 	});

// 	return res;
// };

// export const POST: RequestHandler = async ({ cookies, fetch, request }) => {
// 	const data = await request.json();

// 	const res = await fetch(`${API_URL}/recruitment`, {
// 		method: 'POST',
// 		headers: {
// 			'Content-Type': 'application/json'
// 			// authorization: `${await getToken(cookies)}`
// 		},
// 		body: JSON.stringify(data)
// 	});

// 	return res;
// };

// api/recruitment/+server.ts

import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private'; // Make sure API_URL includes http://localhost:3333

// Assuming your AdonisJS backend route for "get all" is http://localhost:3333/api/v1/recruitments
const RECRUITMENTS_API_ENDPOINT = `${API_URL}/recruitments`;

export const GET: RequestHandler = async ({ cookies, fetch }) => {
	const res = await fetch(RECRUITMENTS_API_ENDPOINT, {
		// Corrected URL
		method: 'GET',
		headers: {
			// It's good practice to ensure getToken doesn't return "Bearer undefined"
			// if the token is not found. Handle it gracefully or ensure token is always present.
			authorization: `${await getToken(cookies)}`
		}
	});

	// Optional: Basic error handling
	if (!res.ok) {
		console.error(`Backend GET error (${res.status}):`, await res.text());
		// Depending on your frontend error handling, you might re-throw or return a new Response
		// For simple proxying, returning res directly propagates the status and body
	}

	return res;
};

export const POST: RequestHandler = async ({ cookies, fetch, request }) => {
	const data = await request.json();

	const res = await fetch(RECRUITMENTS_API_ENDPOINT, {
		// Corrected URL
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}` // UNCOMMENTED
		},
		body: JSON.stringify(data)
	});

	// Optional: Basic error handling
	if (!res.ok) {
		console.error(`Backend POST error (${res.status}):`, await res.text());
	}

	return res;
};
