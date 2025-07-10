import type { Cookies } from '@sveltejs/kit';

export function setToken(cookies: Cookies, token: string) {
  cookies.set('Authorization', `Bearer ${token}`, {
    path: '/',
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production', // Sécurisé en production
    httpOnly: true
  });
}

export function getToken(cookies: Cookies): string | null {
  try {
    const token = cookies.get('Authorization');
    return token || null; // Retourne null au lieu d'undefined
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

export function removeToken(cookies: Cookies): void {
  try {
    cookies.delete('Authorization', { path: '/' });
  } catch (error) {
    console.error('Error removing token:', error);
  }
}

// Fonction utilitaire pour vérifier si le token est valide
export function isTokenValid(cookies: Cookies): boolean {
  const token = getToken(cookies);
  return token !== null && token.startsWith('Bearer ');
}
