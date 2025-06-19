// src/routes/api/projects/[id]/management/auditions/section-pdfs/+server.ts
import { type RequestHandler } from '@sveltejs/kit'
import { API_URL } from '$env/static/private'
import { getToken } from '$lib/server/authentification'

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
	try {
		console.log('Frontend: Getting PDFs for project', params.id)

		const response = await fetch(`${API_URL}/projects/${params.id}/management/auditions/pdfs`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		})

		console.log('Backend response status:', response.status)

		if (!response.ok) {
			const errorText = await response.text()
			console.error('Backend error:', errorText)
		}

		return response
	} catch (error) {
		console.error('Error fetching section PDFs:', error)
		return new Response(JSON.stringify({
			error: 'Internal server error',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

// ✅ CORRECTION : Upload PDF pour une section spécifique avec meilleur logging
export const POST: RequestHandler = async ({ params, cookies, fetch, request }) => {
	try {
		console.log('Frontend: Uploading PDF for section in project', params.id)

		const formData = await request.formData()

		// Log des données du formulaire pour debug
		console.log('FormData contents:')
		for (const [key, value] of formData.entries()) {
			if (value instanceof File) {
				console.log(`${key}: File(${value.name}, ${value.size} bytes)`)
			} else {
				console.log(`${key}: ${value}`)
			}
		}

		const response = await fetch(`${API_URL}/projects/${params.id}/management/auditions/upload-pdf-section`, {
			method: 'POST',
			headers: {
				authorization: `${await getToken(cookies)}`
			},
			body: formData
		})

		console.log('Upload response status:', response.status)

		// Lire la réponse complète pour debug
		const responseText = await response.text()
		console.log('Upload response body:', responseText)

		if (!response.ok) {
			console.error('Upload failed:', responseText)
		}

		// Retourner la réponse avec le bon status et le contenu
		return new Response(responseText, {
			status: response.status,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		console.error('Error uploading section PDF:', error)
		return new Response(JSON.stringify({
			error: 'Internal server error',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

// Supprimer un PDF d'une section
export const DELETE: RequestHandler = async ({ params, cookies, fetch, url }) => {
	try {
		const pdfFileId = url.searchParams.get('pdfFileId')

		if (!pdfFileId) {
			return new Response(JSON.stringify({
				error: 'PDF file ID is required'
			}), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			})
		}

		console.log('Frontend: Deleting PDF', pdfFileId, 'from project', params.id)

		const response = await fetch(`${API_URL}/projects/${params.id}/management/auditions/section-pdfs/${pdfFileId}`, {
			method: 'DELETE',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		})

		console.log('Delete response status:', response.status)

		if (!response.ok) {
			const errorText = await response.text()
			console.error('Delete error:', errorText)
		}

		return response
	} catch (error) {
		console.error('Error deleting section PDF:', error)
		return new Response(JSON.stringify({
			error: 'Internal server error',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}