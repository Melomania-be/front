import { getToken, removeToken } from '$lib/server/authentification';
import { redirect, type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';
import ResponseHandlerServer from '$lib/server/ResponseHandlerServer';

export const GET: RequestHandler = async ({ cookies, fetch }) => {
	try {
		const token = getToken(cookies);

		if (token) {
			const res = await fetch(`${API_URL}/sign_out`, {
				method: 'GET',
				headers: {
					authorization: token // Le token contient déjà "Bearer "
				}
			});

			const responseHandler = new ResponseHandlerServer();
			await responseHandler.handle(res, cookies, async () => {
				removeToken(cookies);
			});
		} else {
			// Supprimer le token même s'il n'existe pas
			removeToken(cookies);
		}
	} catch (error) {
		console.error('Logout error:', error);
		removeToken(cookies);
	}

	throw redirect(302, '/login');
};
