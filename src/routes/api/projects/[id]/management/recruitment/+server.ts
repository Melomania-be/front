// src/routes/api/projects/[id]/management/recruitment/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

function validateId(id: string | undefined): string | null {
	if (!id || id === 'undefined' || id === 'null' || isNaN(Number(id))) {
		return null;
	}
	return id;
}

export const GET: RequestHandler = async ({ params, cookies, url, fetch }) => {
	const projectId = validateId(params.id);

	if (!projectId) {
		return new Response(JSON.stringify({
			error: 'Invalid project ID'
		}), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const page = url.searchParams.get('page') || '1';
	const limit = url.searchParams.get('limit') || '50';
	const filter = url.searchParams.get('filter') || '';
	const orderBy = url.searchParams.get('orderBy') || 'created_at';
	const order = url.searchParams.get('order') || 'desc';

	try {
		const res = await fetch(
			`${API_URL}/projects/${projectId}/management/recruitment/contacts?limit=${limit}&page=${page}&filter=${filter}&orderBy=${orderBy}&order=${order}`,
			{
				method: 'GET',
				headers: {
					authorization: `${await getToken(cookies)}`
				}
			}
		);

		return res;
	} catch (error) {
		return new Response(JSON.stringify({
			error: 'Failed to fetch recruitment contacts'
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
