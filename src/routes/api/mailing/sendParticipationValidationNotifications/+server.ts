import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { BACKEND_API_HOST, BACKEND_API_PORT } from '$env/static/private';

export const POST: RequestHandler = async ({ cookies, request, fetch }) => {
	const data = await request.json();

	const res = await fetch(
		`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/mailing/sendParticipationValidationNotification`,
		{
			method: 'POST',
			headers: {
				authorization: `${await getToken(cookies)}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		}
	);

	return res;
};
