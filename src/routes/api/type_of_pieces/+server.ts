import { getToken } from '$lib/server/authentification';
import { error, json, type RequestHandler } from '@sveltejs/kit';
import { BACKEND_API_HOST, BACKEND_API_PORT } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies, fetch }) => {
	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/type_of_pieces`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application',
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};

export const PUT: RequestHandler = async ({ cookies, fetch, request }) => {
	const data = await request.json();

	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/type_of_pieces`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify(await data)
	});

	return res;
};

export const DELETE: RequestHandler = async ({ cookies, fetch, request }) => {
	const typeOfPiece = await request.json();

	await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/type_of_pieces/${typeOfPiece.id}`, {
		method: 'DELETE',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify(typeOfPiece)
	});
	return new Response();
};
