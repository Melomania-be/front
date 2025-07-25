// src/routes/api/materials/[id]/files/+server.ts - Gestion des fichiers d'un matériel
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
    const res = await fetch(`${API_URL}/materials/${params.id}/files`, {
        method: 'GET',
        headers: {
            authorization: `${await getToken(cookies)}`
        }
    });

    return res;
};

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