import type { Cookies } from '@sveltejs/kit';

export function setToken(cookies: Cookies, token: string) {
    cookies.set('Authorization', `Bearer ${token}`, {
       path: '/',
       expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // ✅ 24h au lieu de 30 jours
       sameSite: 'lax',
       secure: true,    // ✅ toujours activé (suppression de la condition NODE_ENV)
       httpOnly: true   // ✅ toujours activé (suppression de la condition NODE_ENV)
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
       cookies.delete('Authorization', {
          path: '/',
          sameSite: 'lax',
          secure: true,    // ✅ cohérent avec setToken
          httpOnly: true   // ✅ cohérent avec setToken
       });
    } catch (error) {
       console.error('Error removing token:', error);
    }
}

export function isTokenValid(cookies: Cookies): boolean {
    try {
       const token = getToken(cookies);
       if (!token || typeof token !== 'string') {
          return false;
       }
       if (!token.startsWith('Bearer ') || token.length <= 7) {
          removeToken(cookies);
          return false;
       }
       return true;
    } catch (error) {
       console.error('Error validating token:', error);
       removeToken(cookies);
       return false;
    }
}

export function cleanupCorruptedCookies(cookies: Cookies): void {
    try {
       const token = cookies.get('Authorization');
       if (token && (!token.startsWith('Bearer ') || token.length <= 7)) {
          console.log('Cleaning up corrupted token cookie');
          removeToken(cookies);
       }
    } catch (error) {
       console.error('Error cleaning up cookies:', error);
       try {
          cookies.delete('Authorization', { path: '/' });
       } catch (e) {
          console.error('Failed to force delete cookie:', e);
       }
    }
}