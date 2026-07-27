import type { RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';
import { getToken } from '$lib/server/authentification';



export const GET: RequestHandler = async ({
	params,
	fetch,
	cookies
}) => {
    console.log('=== FILE PROXY ===')
console.log('filename:', params.filename)

const token = await getToken(cookies)
console.log('token exists:', !!token)
	const res = await fetch(
    `${API_URL}/contractor-interaction/file/${params.filename}`,
    {
        headers: {
            authorization: `${token}`
        }
    }
)

console.log('backend status:', res.status)

	return new Response(res.body, {
		status: res.status,
		headers: res.headers
	});
};