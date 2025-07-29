import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

const BACKEND_ALERTS_ENDPOINT = `${API_URL}/recruitment-alerts`;

export const GET: RequestHandler = async ({ cookies, fetch, url }) => {
	const res = await fetch(`${BACKEND_ALERTS_ENDPOINT}${url.search}`, {
		method: 'GET',
		headers: { authorization: `${await getToken(cookies)}` }
	});
	if (!res.ok) {
		console.error(
			`Backend GET ${BACKEND_ALERTS_ENDPOINT} error (${res.status}):`,
			await res.text()
		);
		return new Response(await res.text(), { status: res.status });
	}
	return new Response(JSON.stringify(await res.json()), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
};
