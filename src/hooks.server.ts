import { getToken, isTokenValid } from '$lib/server/authentification';
import ResponseHandlerServer from '$lib/server/ResponseHandlerServer';
import { redirect } from '@sveltejs/kit';

export const handle = async ({ resolve, event }) => {
  /* Authorization check */
  const authorization = getToken(event.cookies);
  const isAuthorized = isTokenValid(event.cookies);
  
  // Gestion de la page d'accueil
  if (event.url.pathname === '/') {
    if (isAuthorized) {
      throw redirect(307, '/projects');
    } else {
      throw redirect(307, '/login');
    }
  }
  
  // Pages qui ne nécessitent pas d'autorisation
  const publicPaths = ['/login', '/registration', '/call_sheets'];
  const isPublicPath = publicPaths.some(path => event.url.pathname.startsWith(path));
  const isApiPath = event.url.pathname.startsWith('/api');
  
  // Vérification d'autorisation pour les pages protégées
  if (!isPublicPath && !isApiPath) {
    if (!isAuthorized) {
      console.log('Not authorized, redirecting to login');
      throw redirect(307, '/login');
    }
    console.log(`Authorized with token ${authorization}`);
  } else {
    console.log('No authorization needed');
  }
  
  // Gestion CORS pour les API
  if (isApiPath && event.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*'
      }
    });
  }
  
  const response = await resolve(event);
  
  const responseHandler = new ResponseHandlerServer();
  await responseHandler.handle(response, event.cookies, async () => {
    console.log(
      `Successful request ${event.request.method} ${event.url.pathname} - ${response.status}`
    );
  });
  
  return response;
};
