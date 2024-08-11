import type { PageServerLoad } from './$types';
import { getToken } from '$lib/server/authentification';
import { API_URL } from '$env/static/private';
import ResponseHandlerClient from '$lib/client/ResponseHandlerClient';
import { redirect } from '@sveltejs/kit';
import { StatusCodesRedirection } from '$lib/common/statusCodes';

export const load: PageServerLoad = async ({ cookies, params, fetch }) => {
	const id = Number(params.id);

	const serverResponseContact = await fetch(
		'http://' + BACKEND_API_HOST + ':' + BACKEND_API_PORT + '/contact/' + id,
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			}
		}
	);

	if (serverResponseContact.status !== 200) {
		redirect(StatusCodesRedirection.TEMPORARY_REDIRECT, '/contacts');
	}

	const contact = await serverResponseContact.json();

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

	const data = { contact, instruments };

	return data;
	//return { ...data};
};
