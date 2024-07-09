import type { PageServerLoad } from './$types';
import { getToken } from '$lib/server/authentification';
import { BACKEND_API_HOST, BACKEND_API_PORT } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import { StatusCodesRedirection } from '$lib/common/statusCodes';

export const load: PageServerLoad = async ({ cookies, params, fetch }) => {
	const id = Number(params.id);

	const serverResponseProject = await fetch(
		'http://' + BACKEND_API_HOST + ':' + BACKEND_API_PORT + '/projects/' + id,
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

	const serverResponsePieces = await fetch(
		'http://' + BACKEND_API_HOST + ':' + BACKEND_API_PORT + '/piece',
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application',
				authorization: `${await getToken(cookies)}`
			}
		}
	);

	if (!serverResponsePieces.ok) {
		redirect(StatusCodesRedirection.TEMPORARY_REDIRECT, '/projects');
	}

	const pieces = await serverResponsePieces.json();


	const serverResponseSectionGroups = await fetch(
		'http://' + BACKEND_API_HOST + ':' + BACKEND_API_PORT + '/sectionGroups',
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application',
				authorization: `${await getToken(cookies)}`
			}
		}
	);

	if (!serverResponseSectionGroups.ok) {
		redirect(StatusCodesRedirection.TEMPORARY_REDIRECT, '/projects');
	}

	const sectionGroups = await serverResponseSectionGroups.json();

	return {project, pieces, sectionGroups};
};
