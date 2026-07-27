import type { RequestHandler } from '@sveltejs/kit'
import { API_URL } from '$env/static/private'
import { getToken } from '$lib/server/authentification'

export const POST: RequestHandler = async ({
  params,
  request,
  fetch,
  cookies,
}) => {
  const formData = await request.formData()

  const res = await fetch(
    `${API_URL}/contractor-interaction/${params.id}/upload`,
    {
      method: 'POST',
      headers: {
        authorization: `${await getToken(cookies)}`,
      },
      body: formData,
    }
  )

  return new Response(await res.text(), {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}