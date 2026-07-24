import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

// POST /api/users/:id/projects → assigne des projets à un guest
export const POST: RequestHandler = async ({ cookies, request, fetch, params }) => {
  const data = await request.json();

  const res = await fetch(`${API_URL}/users/${params.id}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization: `${await getToken(cookies)}`
    },
    body: JSON.stringify(data)
  });

  return res;
};