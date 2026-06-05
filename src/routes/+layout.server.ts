import { API_URL } from '$env/static/private';
import { getToken } from '$lib/server/authentification';
import ResponseHandlerServer from '$lib/server/ResponseHandlerServer';

export async function load({ cookies }) {
	const token = getToken(cookies);

	if (!token) {
		return {
			connected: false
		};
	}

	const res = await fetch(`${API_URL}/verify`, {
		method: 'GET',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	const responseHandler = new ResponseHandlerServer();

	await responseHandler.handle(res, cookies);

	let currentUser = null;
	try {
		const currentUserResponse = await fetch(`${API_URL}/users/current`, {
			method: 'GET',
			headers: {
				authorization: `${token}`
			}
		});

		if (currentUserResponse.ok) {
			currentUser = await currentUserResponse.json();
		}
	} catch (error) {
		console.error('Failed to load current user:', error);
	}

	return {
		connected: true,
		currentUser
	};
}
