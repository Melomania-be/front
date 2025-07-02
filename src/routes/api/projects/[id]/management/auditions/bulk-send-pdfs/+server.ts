// src/routes/api/projects/[id]/management/auditions/bulk-send-pdfs/+server.ts
import { type RequestHandler } from '@sveltejs/kit'
import { API_URL } from '$env/static/private'
import { getToken } from '$lib/server/authentification'

export const POST: RequestHandler = async ({ params, cookies, fetch, request }) => {
	try {
		const body = await request.json()

		console.log('Frontend: Bulk sending PDFs to section', body.section_id, 'for project', params.id)

		const response = await fetch(`${API_URL}/projects/${params.id}/management/auditions/bulk-send-pdfs`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			},
			body: JSON.stringify(body)
		})

		// Log de la réponse pour debug
		const responseText = await response.text()
		console.log('Backend response status:', response.status)
		console.log('Backend response:', responseText)

		return new Response(responseText, {
			status: response.status,
			headers: {
				'Content-Type': 'application/json'
			}
		})
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