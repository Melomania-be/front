import { getToken, removeToken } from '$lib/server/authentification';
import { redirect, type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';
import ResponseHandlerServer from '$lib/server/ResponseHandlerServer';
import { StatusCodesRedirection } from '$lib/common/statusCodes';

export const GET: RequestHandler = async ({ cookies, fetch }) => {
	const res = await fetch(`${API_URL}/sign_out`, {
		method: 'GET',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	const responseHandler = new ResponseHandlerServer();

	await responseHandler.handle(res, cookies, async () => {
		removeToken(cookies);
	});

	return redirect(StatusCodesRedirection.TEMPORARY_REDIRECT, '/login');
};
