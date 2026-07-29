import { API_URL } from '$env/static/private';
import { getToken } from '$lib/server/authentification';
import ResponseHandlerServer from '$lib/server/ResponseHandlerServer';

export async function load({ cookies, fetch }) {
	const token = getToken(cookies);

	// Fetch app visual settings (public endpoint — no auth required)
	let appSettings = { primary_color: '#343CAD', has_logo: false, has_background: false };
	try {
		const settingsRes = await fetch(`${API_URL}/app_settings`);
		if (settingsRes.ok) {
			appSettings = await settingsRes.json();
		}
	} catch {}

	if (!token) {
		return { connected: false, appSettings };
	}

	const res = await fetch(`${API_URL}/verify`, {
		method: 'GET',
		headers: { authorization: `${await getToken(cookies)}` }
	});

	const responseHandler = new ResponseHandlerServer();
	await responseHandler.handle(res, cookies);

	return { connected: true, appSettings };
}
