import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

const BACKEND_RESOLVE_ENDPOINT = `${API_URL}/recruitment-alerts`;

export const PATCH: RequestHandler = async ({ cookies, fetch, params }) => {
	const alertId = params.id;
	const res = await fetch(`${BACKEND_RESOLVE_ENDPOINT}/${alertId}/resolve`, {
		method: 'PATCH',
		headers: { authorization: `${await getToken(cookies)}` }
	});
	if (!res.ok) {
		console.error(
			`Backend PATCH ${BACKEND_RESOLVE_ENDPOINT}/${alertId}/resolve error (${res.status}):`,
			await res.text()
		);
		return new Response(await res.text(), { status: res.status });
	}
	return new Response(JSON.stringify(await res.json()), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
};
