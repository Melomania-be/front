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

	if (serverResponseProject.status !== 200) {
		redirect(StatusCodesRedirection.TEMPORARY_REDIRECT, '/projects');
	}

	const project = await serverResponseProject.json();

	const serverResponseInstruments = await fetch(
		'http://' + BACKEND_API_HOST + ':' + BACKEND_API_PORT + '/instrument',
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			}
		}
	);

	const instruments = await serverResponseInstruments.json();

	const serverResponseSectionGroups = await fetch(
		'https://' + BACKEND_API_HOST + ':' + BACKEND_API_PORT + '/sectionGroups',
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			}
		}
	);

	const sectionGroups = await serverResponseSectionGroups.json();

	const serverResponsePieces = await fetch(
		'https://' + BACKEND_API_HOST + ':' + BACKEND_API_PORT + '/pieces',
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			}
		}
	);

	const pieces = await serverResponsePieces.json();

	const data = { project, instruments, sectionGroups, pieces };

	return data;
};
