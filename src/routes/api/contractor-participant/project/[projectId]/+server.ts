import type { RequestHandler } from '@sveltejs/kit'
import { API_URL } from '$env/static/private'
import { getToken } from '$lib/server/authentification'

export const GET: RequestHandler = async ({
    params,
    fetch,
    cookies,
}) => {
    const res = await fetch(
        `${API_URL}/contractor-participant/project/${params.projectId}`,
        {
            headers: {
                authorization: `${await getToken(cookies)}`,
            },
        }
    )

    return res
}