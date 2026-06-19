// src/routes/api/projects/[id]/management/recruitment/stats/+server.ts - Version corrigée
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

function validateId(id: string | undefined): string | null {
	if (!id || id === 'undefined' || id === 'null' || isNaN(Number(id))) {
		return null;
	}
	return id;
}

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
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
		const res = await fetch(`${API_URL}/projects/${projectId}/management/recruitment/stats`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		return res;
	} catch (error) {
		console.error('Error fetching recruitment stats:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to fetch recruitment stats'
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};
