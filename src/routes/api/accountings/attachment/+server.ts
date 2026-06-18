import { API_URL } from '$env/static/private'
import { getToken } from '$lib/server/authentification'
import type { RequestHandler } from '@sveltejs/kit'


export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
	const formData = await request.formData();

	const res = await fetch(`${API_URL}/accountings/attachment`, {
		method: 'POST',
		headers: {
			authorization: `${await getToken(cookies)}`
		},
		body: formData
	});

	const responseBody = await res.json();

	if (!res.ok) {
		return new Response(JSON.stringify(responseBody), {
			status: res.status,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	return new Response(JSON.stringify(responseBody), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
};