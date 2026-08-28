import { getToken } from '$lib/server/authentification';
import { API_URL } from '$env/static/private';
import type { RequestHandler } from '@sveltejs/kit';

// Récupérer les tâches (Transfère les filtres comme ?projectId=1)
export const GET: RequestHandler = async ({ url, cookies, fetch }) => {
	const response = await fetch(`${API_URL}/tasks${url.search}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		}
	});

	return response;
};

// Créer une nouvelle tâche
export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
	const body = await request.text(); // On récupère les données envoyées par le front

	const response = await fetch(`${API_URL}/tasks`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body
	});

	return response;
};