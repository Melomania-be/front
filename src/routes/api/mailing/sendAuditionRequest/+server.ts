// src/routes/api/mailing/sendAuditionRequest/+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ cookies, request, fetch }) => {
	const data = await request.json();

	console.log('🎭 Frontend API: Sending audition request email for participant:', data.participantId);

	try {
		const res = await fetch(
			`${API_URL}/mailing/sendAuditionRequest`,
			{
				method: 'POST',
				headers: {
					authorization: `${await getToken(cookies)}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			}
		);

		if (!res.ok) {
			console.error('❌ Backend returned error:', res.status, res.statusText);
		} else {
			console.log('✅ Audition email sent successfully');
		}

		return res;
	} catch (error) {
		console.error('❌ Network error sending audition email:', error);
		return new Response(JSON.stringify({
			error: 'Network error',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};