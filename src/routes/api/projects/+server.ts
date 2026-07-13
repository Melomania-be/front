import { API_URL } from '$env/static/private';
import { getToken } from '$lib/server/authentification';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, url }) => {
	const token = await getToken(cookies);
	const projectId = url.searchParams.get('project_id');

	const response = await fetch(`${API_URL}/tasks?project_id=${projectId}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${token}`
		}
	});

	const data = await response.json();
	return new Response(JSON.stringify(data), {
		status: response.status,
		headers: { 'Content-Type': 'application/json' }
	});
};

export const POST: RequestHandler = async ({ cookies, request }) => {
	const token = await getToken(cookies);
	const body = await request.json();

	const response = await fetch(`${API_URL}/tasks`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${token}`
		},
		body: JSON.stringify(body)
	});

	const data = await response.json();
	return new Response(JSON.stringify(data), {
		status: response.status,
		headers: { 'Content-Type': 'application/json' }
	});
};