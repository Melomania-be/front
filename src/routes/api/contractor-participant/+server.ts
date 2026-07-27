import type { RequestHandler } from '@sveltejs/kit'
import { API_URL } from '$env/static/private'
import { getToken } from '$lib/server/authentification'

export const POST: RequestHandler = async ({
    request,
    fetch,
    cookies,
}) => {
    const data = await request.json()

    const res = await fetch(
        `${API_URL}/contractor-participant`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                authorization: `${await getToken(cookies)}`,
            },
            body: JSON.stringify(data),
        }
    )

    return res
}