// src/routes/api/materials/[id]/set-default/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ params, cookies, fetch }) => {
    const res = await fetch(`${API_URL}/materials/${params.id}/set-default`, {
        method: 'POST',
        headers: {
            authorization: `${await getToken(cookies)}`
        }
    });

    return res;
};