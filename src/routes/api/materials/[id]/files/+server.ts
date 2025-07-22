// src/routes/api/materials/[id]/files/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ params, cookies, request, fetch }) => {
    const formData = await request.formData();

    const res = await fetch(`${API_URL}/materials/${params.id}/files`, {
        method: 'POST',
        headers: {
            authorization: `${await getToken(cookies)}`
        },
        body: formData
    });

    return res;
};