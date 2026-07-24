import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

// PATCH /api/users/:id/privileges → modifie rôle/permissions
export const PATCH: RequestHandler = async ({ cookies, request, fetch, params }) => {
  const data = await request.json();

  const res = await fetch(`${API_URL}/users/${params.id}/privileges`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      authorization: `${await getToken(cookies)}`
    },
    body: JSON.stringify(data)
  });

  return res;
};