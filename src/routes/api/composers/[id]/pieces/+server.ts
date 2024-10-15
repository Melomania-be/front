import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
    const res = await fetch(`${API_URL}/composer/${params.id}/pieces`, {
        method: 'GET',
        headers: {
            authorization: `${await getToken(cookies)}`
        }
    });

    console.log('ici lalala')

	return res;
};