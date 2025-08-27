// src/routes/api/users/+server.ts - Version mise à jour avec fullName
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies, request, fetch }) => {
	const res = await fetch(`${API_URL}/users`, {
		method: 'GET',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};

export const PUT: RequestHandler = async ({ cookies, request, fetch }) => {
	const data = await request.json();

	const res = await fetch(`${API_URL}/users/`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify(data)
	});

	return res;
};

// 🆕 Nouvelle route PATCH pour modifier les utilisateurs existants
export const PATCH: RequestHandler = async ({ cookies, request, fetch }) => {
	const data = await request.json();

	const res = await fetch(`${API_URL}/users/${data.id}`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}`
		},
		body: JSON.stringify({
			email: data.email,
			fullName: data.fullName
		})
	});

	return res;
};

export const DELETE: RequestHandler = async ({ cookies, request, fetch }) => {
	const { id } = await request.json();

	const res = await fetch(`${API_URL}/users/${id}`, {
		method: 'DELETE',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};