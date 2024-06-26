import { BACKEND_API_HOST, BACKEND_API_PORT } from "$env/static/private";
import { getToken } from "$lib/server/authentification";
import type { RequestHandler } from "@sveltejs/kit";

export const GET: RequestHandler = async ({ cookies, url, fetch }) => {
	const page = url.searchParams.get('page');
	const limit = url.searchParams.get('limit');
	const filter = url.searchParams.get('filter');
	const orderBy = url.searchParams.get('orderBy');
	const order = url.searchParams.get('order');

	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/lists?limit=${limit}&page=${page}&filter=${filter}&orderBy=${orderBy}&order=${order}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application',
			authorization: `${await getToken(cookies)}`
		}
	});

	console.log(res)
	return res;
};

export const PUT: RequestHandler = async ({ cookies, fetch, request }) => {
    const data = await request.json();

    const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/lists`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            authorization: `${await getToken(cookies)}`
        },
        body: JSON.stringify(await data)
    });

    return res;
};