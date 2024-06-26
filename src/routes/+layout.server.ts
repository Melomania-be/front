import { BACKEND_API_HOST, BACKEND_API_PORT } from '$env/static/private';
import { getToken } from '$lib/server/authentification';
import ResponseHandlerServer from '$lib/server/ResponseHandlerServer';

export async function load({ cookies }) {
	const token = getToken(cookies);

	if (!token) {
		return {
			connected: false
		};
	}

	const res = await fetch(`http://${BACKEND_API_HOST}:${BACKEND_API_PORT}/verify`, {
		method: 'GET',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	const responseHandler = new ResponseHandlerServer();

	await responseHandler.handle(res, cookies);

	return {
		connected: true
	};
}
