// src/routes/api/audition/[token]/pdfs/+server.ts
import { type RequestHandler } from '@sveltejs/kit'
import { API_URL } from '$env/static/private'

export const GET: RequestHandler = async ({ params, fetch }) => {
	try {
		const response = await fetch(`${API_URL}/audition/${params.token}/pdfs`)
		return response
	} catch (error) {
		console.error('Error fetching PDFs:', error)
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}