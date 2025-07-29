// import { getToken } from '$lib/server/authentification';
// import { type RequestHandler } from '@sveltejs/kit';
// import { API_URL } from '$env/static/private';

// const BACKEND_RESOLVE_AS_UPDATE_ENDPOINT = `${API_URL}/recruitment-alerts`;

// export const POST: RequestHandler = async ({ cookies, fetch, params }) => {
// 	const alertId = params.id;
// 	const res = await fetch(`${BACKEND_RESOLVE_AS_UPDATE_ENDPOINT}/${alertId}/resolve-as-update`, {
// 		method: 'POST',
// 		headers: { authorization: `${await getToken(cookies)}` }
// 	});
// 	if (!res.ok) {
// 		console.error(
// 			`Backend POST ${BACKEND_RESOLVE_AS_UPDATE_ENDPOINT}/${alertId}/resolve-as-update error (${res.status}):`,
// 			await res.text()
// 		);
// 		return new Response(await res.text(), { status: res.status });
// 	}
// 	return new Response(JSON.stringify(await res.json()), {
// 		status: 200,
// 		headers: { 'Content-Type': 'application/json' }
// 	});
// };

// src/routes/api/recruitment-alerts/[id]/resolve-as-update/+server.ts

import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

const BACKEND_ALERTS_ENDPOINT = `${API_URL}/recruitment-alerts`;

export const POST: RequestHandler = async ({ cookies, fetch, params }) => {
	try {
		const alertId = params.id; // Get the ID from the URL parameter

		const res = await fetch(`${BACKEND_ALERTS_ENDPOINT}/${alertId}/resolve-as-update`, {
			method: 'POST', // Your backend uses POST for this action
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			}
			// No body needed for this POST request as per your backend controller
		});

		if (!res.ok) {
			console.error(
				`Backend POST ${BACKEND_ALERTS_ENDPOINT}/${alertId}/resolve-as-update error (${res.status}):`,
				await res.text()
			);
			return new Response(await res.text(), {
				status: res.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return new Response(JSON.stringify(await res.json()), {
			status: res.status,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error(
			`Error in SvelteKit API route /api/recruitment-alerts/[id]/resolve-as-update:`,
			error
		);
		return new Response(
			JSON.stringify({ message: 'Internal Server Error resolving alert as update.' }),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};
