import { API_URL } from '$env/static/private';
import { getToken } from '$lib/server/authentification';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, fetch }) => {
	try {
		const res = await fetch(`${API_URL}/expense_categories`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			}
		});

		if (!res.ok) {
			console.error('Backend error:', res.status, res.statusText);
		}

		return res;
	} catch (error) {
		console.error('API route error:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};

export const POST: RequestHandler = async ({ cookies, request, fetch }) => {
	try {
		const body = await request.json();

		const res = await fetch(`${API_URL}/expense_categories`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			},
			body: JSON.stringify(body)
		});

		if (!res.ok) {
			console.error('Backend error:', res.status, res.statusText);
		}

		return res;
	} catch (error) {
		console.error('API route error:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
