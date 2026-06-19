// src/routes/api/projects/[id]/management/recruitment/contacts/import/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ params, cookies, request, fetch }) => {
	const data = await request.json();

	const res = await fetch(
		`${API_URL}/projects/${params.id}/management/recruitment/contacts/import`,
		{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			},
			body: JSON.stringify(data)
		}
	);

	return res;
};
