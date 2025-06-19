// src/routes/api/projects/[id]/management/auditions/upload-pdf/+server.ts
import { type RequestHandler } from '@sveltejs/kit'
import { API_URL } from '$env/static/private'
import { getToken } from '$lib/server/authentification'

export const POST: RequestHandler = async ({ params, cookies, fetch, request }) => {
	try {
		const formData = await request.formData()

		const response = await fetch(`${API_URL}/projects/${params.id}/management/auditions/upload-pdf`, {
			method: 'POST',
			headers: {
				authorization: `${await getToken(cookies)}`
			},
			body: formData
		})

		return response
	} catch (error) {
		console.error('Error uploading PDF:', error)
		return new Response(JSON.stringify({
			error: 'Internal server error',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}