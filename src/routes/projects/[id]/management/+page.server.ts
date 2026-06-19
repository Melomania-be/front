import type { PageServerLoad } from './$types';
import { getToken } from '$lib/server/authentification';
import { API_URL } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import { StatusCodesRedirection } from '$lib/common/statusCodes';

export const load: PageServerLoad = async ({ cookies, params, fetch }) => {
	const id = Number(params.id);

	try {
		const serverResponseProject = await fetch(
			`${API_URL}/projects/${id}/management`, // Pas de slash à la fin
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					authorization: `${await getToken(cookies)}`
				}
			}
		);

		if (!serverResponseProject.ok) {
			console.error('Failed to load project:', serverResponseProject.status);
			redirect(StatusCodesRedirection.TEMPORARY_REDIRECT, '/projects');
		}

		const projectData = await serverResponseProject.json();

		// Debug: log pour voir la structure des données
		console.log('Project data structure:', {
			hasData: !!projectData.data,
			dataType: typeof projectData.data,
			isArray: Array.isArray(projectData.data),
			keys: Object.keys(projectData)
		});

		return projectData;
	} catch (error) {
		console.error('Error loading project:', error);
		redirect(StatusCodesRedirection.TEMPORARY_REDIRECT, '/projects');
	}
};
