import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
	const res = await fetch(
		`${API_URL}/files/download/${params.id}`,
		{
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		}
	);

	return res;
};

export const DELETE: RequestHandler = async ({ params, cookies, fetch }) => {
	const res = await fetch(`${API_URL}/files/${params.id}`, {
		method: 'DELETE',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	return res;
};

export const PUT: RequestHandler = async ({ params, cookies, request, fetch }) => {
    const { name } = await request.json();

    if (!name) {
        return new Response(JSON.stringify({ message: 'New name is required' }), { status: 400 });
    }

    const res = await fetch(`${API_URL}/files/${params.id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            authorization: `${await getToken(cookies)}`
        },
        body: JSON.stringify({ name })
    });

    return res;
}