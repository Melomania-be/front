import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { BACKEND_API_HOST, BACKEND_API_PORT } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies, url, fetch }) => {
    const res = await fetch(
        `http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/templates/`,{
            method: 'GET',
            headers: {
                'Content-Type': 'application',
                authorization: `${await getToken(cookies)}`
            }
        }
    );

    console.log(res);
    return res;
}

export const POST: RequestHandler = async ({ cookies, fetch, request }) => {
    const data = await request.json();

    const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/templates/createOrUpdate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            authorization: `${await getToken(cookies)}`
        },
        body: JSON.stringify(await data)
    });

    return res;
}
