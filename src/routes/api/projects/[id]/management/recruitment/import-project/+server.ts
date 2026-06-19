// src/routes/api/projects/[id]/management/recruitment/import-project/+server.ts
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
			`${API_URL}/projects/${projectId}/management/recruitment/import-project`,
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
		console.error('Error importing from project:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to import from project'
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};

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
		// Récupérer la liste des projets disponibles pour l'import
		const res = await fetch(`${API_URL}/projects`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		if (res.ok) {
			const projects = await res.json();
			// Filtrer le projet actuel
			const availableProjects = projects.data
				? projects.data.filter((p) => p.id !== parseInt(projectId))
				: projects.filter((p) => p.id !== parseInt(projectId));

			return new Response(JSON.stringify(availableProjects), {
				status: 200,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		return res;
	} catch (error) {
		console.error('Error fetching projects for import:', error);
		return new Response(
			JSON.stringify({
				error: 'Failed to fetch projects for import'
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};
