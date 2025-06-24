// // routes/api/recruitment/check-status/+server.ts

// import { getToken } from '$lib/server/authentification';
// import { type RequestHandler } from '@sveltejs/kit';
// import { API_URL } from '$env/static/private';

// const CHECK_STATUS_API_ENDPOINT = `${API_URL}/recruitments/check-status`; // Match backend route

// export const POST: RequestHandler = async ({ cookies, fetch, request }) => {
// 	const data = await request.json(); // Expects { checkDateTime: string }

// 	const res = await fetch(CHECK_STATUS_API_ENDPOINT, {
// 		method: 'POST',
// 		headers: {
// 			'Content-Type': 'application/json',
// 			authorization: `${await getToken(cookies)}` // Ensure authentication
// 		},
// 		body: JSON.stringify(data)
// 	});

// 	if (!res.ok) {
// 		const errorResponseClone = res.clone(); // Clone for debugging
// 		console.error(`Backend check-status error (${res.status}):`, await errorResponseClone.text());
// 	}

// 	return res;
// };

import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

const CHECK_STATUS_API_ENDPOINT = `${API_URL}/recruitments/check-status`;

export const POST: RequestHandler = async ({ cookies, fetch, request }) => {
	const { daysThreshold } = await request.json();

	const res = await fetch(CHECK_STATUS_API_ENDPOINT, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify({ daysThreshold })
	});

	if (!res.ok) {
		const errorResponseClone = res.clone();
		console.error(`Backend check-status error (${res.status}):`, await errorResponseClone.text());
	}

	return res;
};
