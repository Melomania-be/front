import { removeToken, setToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ cookies, request, fetch }) => {
	const { email, password } = await request.json();

	const res = await fetch(`${API_URL}/sign_in`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ email, password })
	});

	const resClone = res.clone();
	const data = await resClone.json();

	if (data.type === 'bearer') {
		removeToken(cookies);
		setToken(cookies, data.token);
	}

	return new Response(res.body, res);
};
