import type { RequestHandler } from '@sveltejs/kit'
import { API_URL } from '$env/static/private'
import { getToken } from '$lib/server/authentification'

export const DELETE: RequestHandler = async ({
    params,
    fetch,
    cookies,
}) => {
    const res = await fetch(
        `${API_URL}/contractor-participant/${params.id}`,
        {
            method: 'DELETE',
            headers: {
                authorization: `${await getToken(cookies)}`,
            },
        }
    )

    return res
}