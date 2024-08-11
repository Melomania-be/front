import { API_URL } from '$env/static/private';
import { getToken } from '$lib/server/authentification';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, fetch, params }) => {
	const res = await fetch(
		`${API_URL}/projects/${params.id}/management/call_sheets/${params.callsheetId}`,
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			}
		}
	);

	return res;
};

export const DELETE: RequestHandler = async ({ cookies, fetch, params }) => {
	const res = await fetch(
		`${API_URL}/projects/${params.id}/management/call_sheets/${params.callsheetId}`,
		{
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			}
		}
	);

	return res;
};
