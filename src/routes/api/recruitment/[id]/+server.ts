// import { getToken } from '$lib/server/authentification';
// import { type RequestHandler } from '@sveltejs/kit';
// import { API_URL } from '$env/static/private';

// export const GET: RequestHandler = async ({ cookies, fetch, params }) => {
// 	const { id } = params;

// 	const res = await fetch(`${API_URL}/recruitment/${id}`, {
// 		method: 'GET',
// 		headers: {
// 			authorization: `${await getToken(cookies)}`
// 		}
// 	});

// 	return res;
// };

// export const PATCH: RequestHandler = async ({ cookies, fetch, request, params }) => {
// 	const { id } = params;
// 	const data = await request.json();

// 	const res = await fetch(`${API_URL}/recruitment/${id}`, {
// 		method: 'PATCH',
// 		headers: {
// 			'Content-Type': 'application/json',
// 			authorization: `${await getToken(cookies)}`
// 		},
// 		body: JSON.stringify(data)
// 	});

// 	return res;
// };

// export const DELETE: RequestHandler = async ({ cookies, fetch, params }) => {
// 	const { id } = params;

// 	const res = await fetch(`${API_URL}/recruitment/${id}`, {
// 		method: 'DELETE',
// 		headers: {
// 			authorization: `${await getToken(cookies)}`
// 		}
// 	});

// 	return res;
// };

// routes/api/recruitment/[id]/+server.ts

import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

// Define the base API path for clarity and reusability
const BASE_RECRUITMENT_API_PATH = `${API_URL}/recruitments`;

export const GET: RequestHandler = async ({ cookies, fetch, params }) => {
	const { id } = params;

	const res = await fetch(`${BASE_RECRUITMENT_API_PATH}/${id}`, {
		// Corrected URL
		method: 'GET',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	// Optional: Basic error handling as discussed previously
	if (!res.ok) {
		console.error(`Backend GET (ID) error (${res.status}):`, await res.text());
	}

	return res;
};

// Renamed from PATCH to PUT to match AdonisJS backend route (PUT)
export const PUT: RequestHandler = async ({ cookies, fetch, request, params }) => {
	const { id } = params;
	const data = await request.json();

	const res = await fetch(`${BASE_RECRUITMENT_API_PATH}/${id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify(data)
	});

	// FIX START: Clone the response before reading its body for logging
	if (!res.ok) {
		const errorResponseClone = res.clone(); // Clone here!
		console.error(`Backend PUT error (${res.status}):`, await errorResponseClone.text());
		// You might decide to return a new Response here with the error for better client handling
		// return new Response(await errorResponseClone.text(), { status: res.status, headers: res.headers });
	}
	// FIX END

	return res; // Return the original response (unconsumed) for proxying
};

export const DELETE: RequestHandler = async ({ cookies, fetch, params }) => {
	const { id } = params;

	const res = await fetch(`${BASE_RECRUITMENT_API_PATH}/${id}`, {
		// Corrected URL
		method: 'DELETE',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	// Optional: Basic error handling
	if (!res.ok) {
		console.error(`Backend DELETE error (${res.status}):`, await res.text());
	}

	return res;
};
