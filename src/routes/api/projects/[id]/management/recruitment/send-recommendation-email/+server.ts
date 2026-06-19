// src/routes/api/projects/[id]/management/recruitment/send-recommendation-email/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

function validateId(id: string | undefined): string | null {
	if (!id || id === 'undefined' || id === 'null' || isNaN(Number(id))) {
		return null;
	}
	return id;
}

export const POST: RequestHandler = async ({ params, cookies, request, fetch }) => {
	const projectId = validateId(params.id);

	if (!projectId) {
		return new Response(
			JSON.stringify({
				error: 'Invalid project ID'
			}),
			{
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}

	try {
		const data = await request.json();

		const res = await fetch(
			`${API_URL}/projects/${projectId}/management/recruitment/send-recommendation-email`,
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
	} catch (error) {
		console.error('Error sending recommendation email:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to send recommendation email'
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};
