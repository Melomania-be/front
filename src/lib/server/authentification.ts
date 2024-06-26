import type { Cookies } from '@sveltejs/kit';

export function setToken(cookies: Cookies, token: string) {
	cookies.set('Authorization', `Bearer ${token}`, {
		path: '/',
		expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
		sameSite: 'lax',
		secure: false,
		httpOnly: true
	});
}

export function getToken(cookies: Cookies) {
	return cookies.get('Authorization');
}

export function removeToken(cookies: Cookies) {
	cookies.delete('Authorization', { path: '/' });
}
