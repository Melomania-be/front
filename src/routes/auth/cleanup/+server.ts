// src/routes/auth/cleanup/+server.ts
import { removeToken } from '$lib/server/authentification';
import { redirect, type RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		// Force la suppression de tous les cookies d'authentification
		removeToken(cookies);

		// Supprime aussi d'autres cookies potentiellement corrompus
		cookies.delete('Authorization', { path: '/' });
		cookies.delete('auth', { path: '/' });
		cookies.delete('session', { path: '/' });

		console.log('All authentication cookies cleaned up');

		// Redirige vers la page de login
		throw redirect(302, '/login?cleaned=true');
	} catch (error) {
		console.error('Error during cleanup:', error);
		throw redirect(302, '/login?error=cleanup_failed');
	}
};