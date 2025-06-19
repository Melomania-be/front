// src/routes/api/projects/[id]/management/auditions/bulk-send-pdfs/+server.ts
import { type RequestHandler } from '@sveltejs/kit'
import { API_URL } from '$env/static/private'
import { getToken } from '$lib/server/authentification'

export const POST: RequestHandler = async ({ params, cookies, fetch, request }) => {
	try {
		const body = await request.json()

		const response = await fetch(`${API_URL}/projects/${params.id}/management/auditions/bulk-send-pdfs`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			},
			body: JSON.stringify(body)
		})

		return response
	} catch (error) {
		console.error('Error bulk sending PDFs:', error)
		return new Response(JSON.stringify({
			error: 'Internal server error',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}