// src/routes/api/projects/[id]/management/auditions/pdfs/+server.ts
import { type RequestHandler } from '@sveltejs/kit'
import { API_URL } from '$env/static/private'
import { getToken } from '$lib/server/authentification'

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
	try {
		const response = await fetch(`${API_URL}/projects/${params.id}/management/auditions/pdfs`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		})

		return response
	} catch (error) {
		console.error('Error fetching project PDFs:', error)
		return new Response(JSON.stringify({
			error: 'Internal server error',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}