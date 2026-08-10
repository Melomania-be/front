import { getToken } from '$lib/server/authentification';
import { API_URL } from '$env/static/private';
import type { RequestHandler } from '@sveltejs/kit';

// Mettre à jour une tâche existante
export const PUT: RequestHandler = async ({ params, request, cookies, fetch }) => {
	const body = await request.text();

	const response = await fetch(`${API_URL}/tasks/${params.id}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body
	});

	return response;
};

// Supprimer une tâche
export const DELETE: RequestHandler = async ({ params, cookies, fetch }) => {
	const response = await fetch(`${API_URL}/tasks/${params.id}`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		}
	});

	return response;
};