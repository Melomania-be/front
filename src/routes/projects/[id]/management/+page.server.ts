import type { PageServerLoad } from './$types';
import { getToken } from '$lib/server/authentification';
import { API_URL } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import { StatusCodesRedirection } from '$lib/common/statusCodes';

export const load: PageServerLoad = async ({ cookies, params, fetch }) => {
	const id = Number(params.id);

	const serverResponseProject = await fetch(
		`${API_URL}/projects/${id}/management/`,
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			}
		}
	);

	if (!serverResponseProject.ok) {
		redirect(StatusCodesRedirection.TEMPORARY_REDIRECT, '/projects');
	}

	const project = await serverResponseProject.json();

	return project;
};
