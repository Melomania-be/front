import { removeToken, setToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { BACKEND_API_HOST, BACKEND_API_PORT } from '$env/static/private';

export const POST: RequestHandler = async ({ cookies, request, fetch }) => {
	const { email, password } = await request.json();

	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/sign_in`, {
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
