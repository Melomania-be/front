// src/routes/api/filesystem/folders/[id]/share/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ params, cookies, fetch }) => {
	const res = await fetch(`${API_URL}/filesystem/folders/${params.id}/share`, {
		method: 'POST',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});
	return res;
};

export const DELETE: RequestHandler = async ({ params, cookies, fetch }) => {
	const res = await fetch(`${API_URL}/filesystem/folders/${params.id}/share`, {
		method: 'DELETE',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});
	return res;
};
