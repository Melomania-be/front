// // routes/api/recruitment/check-status/+server.ts

import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

const CHECK_STATUS_API_ENDPOINT = `${API_URL}/recruitments/check-status`; // Match backend route

export const POST: RequestHandler = async ({ cookies, fetch, request }) => {
	const data = await request.json(); // Expects { checkDateTime: string }

	const res = await fetch(CHECK_STATUS_API_ENDPOINT, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}` // Ensure authentication
		},
		body: JSON.stringify(data)
	});

	if (!res.ok) {
		const errorResponseClone = res.clone(); // Clone for debugging
		console.error(`Backend check-status error (${res.status}):`, await errorResponseClone.text());
	}

	return res;
};

// import { getToken } from '$lib/server/authentification';
// import { type RequestHandler } from '@sveltejs/kit';
// import { API_URL } from '$env/static/private';
// import { json } from '@sveltejs/kit';

// const CHECK_STATUS_API_ENDPOINT = `${API_URL}/recruitment/check-status`; // Match backend route

// export const POST: RequestHandler = async ({ cookies, fetch, request }) => {
// 	try {
// 		// Parse and validate request body
// 		const data = await request.json();
// 		if (!data.checkDateTime || typeof data.checkDateTime !== 'string') {
// 			return json({ message: 'checkDateTime must be a non-empty string' }, { status: 400 });
// 		}

// 		// Get token and prepare headers
// 		const token = await getToken(cookies);
// 		const headers: Record<string, string> = {
// 			'Content-Type': 'application/json'
// 		};
// 		if (token) {
// 			headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
// 		} else {
// 			return json({ message: 'Authentication token is missing' }, { status: 401 });
// 		}

// 		// Fetch backend with authentication
// 		const res = await fetch(CHECK_STATUS_API_ENDPOINT, {
// 			method: 'POST',
// 			headers,
// 			body: JSON.stringify(data)
// 		});

// 		// Parse response body
// 		const responseBody = await (res.ok ? res.json() : res.json().catch(() => ({})));

// 		if (!res.ok) {
// 			console.error(`Backend check-status error (${res.status}):`, responseBody);
// 			return json(
// 				{
// 					message: responseBody.message || 'Failed to perform status check',
// 					error: responseBody.error || res.statusText
// 				},
// 				{ status: res.status }
// 			);
// 		}

// 		return json(responseBody, { status: res.status });
// 	} catch (error) {
// 		console.error('Server route error:', error);
// 		return json(
// 			{
// 				message: 'Internal server error',
// 				error: error instanceof Error ? error.message : String(error)
// 			},
// 			{ status: 500 }
// 		);
// 	}
// };
