// src/routes/api/projects/[id]/management/recruitment/auto-import-all/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

function validateId(id: string | undefined): string | null {
	if (!id || id === 'undefined' || id === 'null' || isNaN(Number(id))) {
		return null;
	}
	return id;
}

export const POST: RequestHandler = async ({ params, cookies, fetch }) => {
	const projectId = validateId(params.id);

	if (!projectId) {
		return new Response(JSON.stringify({
			error: 'Invalid project ID'
		}), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		console.log('🔄 Frontend: Auto-importing all contacts for project:', projectId);

		const response = await fetch(`${API_URL}/projects/${projectId}/management/recruitment/auto-import-all`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			}
		});

		if (response.ok) {
			const result = await response.json();
			console.log('✅ Frontend: Auto-import completed:', result);
			return new Response(JSON.stringify(result), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return response;
	} catch (error) {
		console.error('❌ Frontend: Error in auto-import:', error);
		return new Response(JSON.stringify({
			error: 'Failed to auto-import contacts',
			imported: [],
			conflicts: [],
			errors: [error.message]
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};