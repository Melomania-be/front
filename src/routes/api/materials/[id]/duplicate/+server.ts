// src/routes/api/materials/[id]/duplicate/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ params, cookies, request, fetch }) => {
    const data = await request.json();

    const res = await fetch(`${API_URL}/materials/${params.id}/duplicate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            authorization: `${await getToken(cookies)}`
        },
        body: JSON.stringify(data)
    });

    return res;
};
