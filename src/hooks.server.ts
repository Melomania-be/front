import { getToken } from '$lib/server/authentification';
import ResponseHandlerServer from '$lib/server/ResponseHandlerServer';
import { redirect } from '@sveltejs/kit';

export const handle = async ({ resolve, event }) => {
	/* Authorization check */
	const authorization = getToken(event.cookies);

	if (event.url.pathname === '/') {
		if (authorization) {
			throw redirect(307, '/projects');
		} else {
			throw redirect(307, '/login');
		}
	}

	if (
		event.url.pathname.startsWith('/call_sheets') ||
		event.url.pathname.startsWith('/login') ||
		event.url.pathname.startsWith('/registration') ||
		event.url.pathname.startsWith('/api')
	) {
		console.log('No authorization needed');
	} else {
		if (!authorization) {
			console.log(`Not authorized`);
			throw redirect(307, '/login');
		}
		console.log(`Authorized with token ${authorization}`);
	}

	if (event.url.pathname.includes('/api')) {
		if (event.request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Headers': '*'
				}
			});
		}
	}

	const response = await resolve(event);

	const responseHandler = new ResponseHandlerServer();
	await responseHandler.handle(response, event.cookies, async () => {
		console.log(
			`Successfull request ${event.request.method} ${event.url.pathname} - ${response.status}`
		);
	});

	return response;
};
