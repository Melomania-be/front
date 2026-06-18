import { API_URL } from '$env/static/private';
import { getToken } from '$lib/server/authentification';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ cookies, params, fetch }) => {
  const { id } = params;

  const res = await fetch(`${API_URL}/projects/${id}/management/participants/answers` ,
    {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
                authorization: `${await getToken(cookies)}`
            }
        }
  );

  if (!res.ok) {
    return new Response('Failed to fetch participants answers', { status: res.status });
  }
  return res
};