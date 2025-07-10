import type { Cookies } from '@sveltejs/kit';

export function setToken(cookies: Cookies, token: string) {
  cookies.set('Authorization', `Bearer ${token}`, {
    path: '/',
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  });
}

export function getToken(cookies: Cookies): string | null {
  try {
    const token = cookies.get('Authorization');
    return token || null;
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
  try {
    const token = getToken(cookies);
    // Vérifications de base
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Le token doit commencer par "Bearer " et avoir une longueur minimum
    if (!token.startsWith('Bearer ') || token.length <= 7) {
      // Token malformé, on le supprime automatiquement
      removeToken(cookies);
      return false;
    }

    // Le token semble valide
    return true;
  } catch (error) {
    console.error('Error validating token:', error);
    // En cas d'erreur, on supprime le token corrompu
    removeToken(cookies);
    return false;
  }
}

// Fonction pour nettoyer automatiquement les cookies corrompus
export function cleanupCorruptedCookies(cookies: Cookies): void {
  try {
    const token = cookies.get('Authorization');
    if (token && (!token.startsWith('Bearer ') || token.length <= 7)) {
      console.log('Cleaning up corrupted token cookie');
      removeToken(cookies);
    }
  } catch (error) {
    console.error('Error cleaning up cookies:', error);
    // Force la suppression en cas d'erreur
    try {
      cookies.delete('Authorization', { path: '/' });
    } catch (e) {
      console.error('Failed to force delete cookie:', e);
    }
  }
}