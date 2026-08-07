import type { PageServerLoad } from './$types';
import { getToken } from '$lib/server/authentification';
import { API_URL } from '$env/static/private';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies, params, fetch }) => {
	const id = Number(params.id);

	const response = await fetch(
		`${API_URL}/contractor/${id}`,
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			}
		}
	);

	if (!response.ok) {
		throw redirect(302, '/contractors');
	}

	const contractor = await response.json();

	return {
		contractor
	};
};