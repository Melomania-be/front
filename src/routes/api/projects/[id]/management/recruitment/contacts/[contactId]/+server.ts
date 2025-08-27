// src/routes/api/projects/[id]/management/recruitment/contacts/[contactId]/+server.ts - Version corrigée
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

function validateId(id: string | undefined): string | null {
	if (!id || id === 'undefined' || id === 'null' || isNaN(Number(id))) {
		return null;
	}
	return id;
}

export const PUT: RequestHandler = async ({ params, cookies, request, fetch }) => {
	const projectId = validateId(params.id);
	const contactId = validateId(params.contactId);

	if (!projectId || !contactId) {
		return new Response(JSON.stringify({
			error: 'Invalid project ID or contact ID'
		}), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const data = await request.json();

		const res = await fetch(`${API_URL}/projects/${projectId}/management/recruitment/contacts/${contactId}/status`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			},
			body: JSON.stringify(data)
		});

		return res;
	} catch (error) {
		console.error('Error updating contact status:', error);
		return new Response(JSON.stringify({
			error: 'Failed to update contact status'
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};

export const DELETE: RequestHandler = async ({ params, cookies, fetch }) => {
	const projectId = validateId(params.id);
	const contactId = validateId(params.contactId);

	if (!projectId || !contactId) {
		return new Response(JSON.stringify({
			error: 'Invalid project ID or contact ID'
		}), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const res = await fetch(`${API_URL}/projects/${projectId}/management/recruitment/contacts/${contactId}`, {
			method: 'DELETE',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		return res;
	} catch (error) {
		console.error('Error deleting contact:', error);
		return new Response(JSON.stringify({
			error: 'Failed to delete contact'
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};