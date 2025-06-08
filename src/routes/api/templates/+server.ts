import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies, url, fetch }) => {
	const res = await fetch(`${API_URL}/templates/`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json', // Correction : changé de 'application' à 'application/json'
			authorization: `${await getToken(cookies)}`
		}
	});

	console.log(res);
	return res;
};

export const PUT: RequestHandler = async ({ cookies, fetch, request }) => {
	const data = await request.json();

	// Assurez-vous que is_default est défini (correction importante)
	if (data.is_default === undefined) {
		data.is_default = false;
	}

	console.log('Data being sent to API:', data); // Log pour debug

	const res = await fetch(
		`${API_URL}/templates/createOrUpdate`,
		{
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			},
			body: JSON.stringify(data) // Correction : retiré 'await' car data est déjà résolu
		}
	);

	if (!res.ok) {
		const errorData = await res.text();
		console.error('API Error:', errorData);
	}

	return res;
};