import { BACKEND_API_HOST, BACKEND_API_PORT } from '$env/static/private';
import { StatusCodesRedirection } from '$lib/common/statusCodes';
import { getToken } from '$lib/server/authentification';
import { redirect, type RequestHandler } from '@sveltejs/kit';

export const DELETE: RequestHandler = async ({ cookies, params, fetch }) => {
	const id = params.id;

	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/projects/${id}`, {
		method: 'DELETE',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};

export const GET: RequestHandler = async ({ cookies, params, fetch }) => {
	const id = params.id;

	const response = await fetch(
		`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/projects/${id}`,
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			}
		}
	);

	return response;
};
