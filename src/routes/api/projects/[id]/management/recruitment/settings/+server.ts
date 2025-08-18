import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

function validateId(id: string | undefined): string | null {
	if (!id || id === 'undefined' || id === 'null' || isNaN(Number(id))) {
		return null;
	}
	return id;
}

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
	const projectId = validateId(params.id);

	if (!projectId) {
		return new Response(JSON.stringify({
			error: 'Invalid project ID'
		}), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		const res = await fetch(`${API_URL}/projects/${projectId}/management/recruitment/settings`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		const responseText = await res.text();

		if (res.ok) {
			try {
				const data = JSON.parse(responseText);
				return new Response(JSON.stringify(data), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			} catch (parseError) {
				console.error('Failed to parse response:', parseError);
				return new Response(JSON.stringify({
					error: 'Invalid response format from server'
				}), {
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		} else {
			console.error('Settings fetch failed:', res.status, responseText);
			return new Response(responseText, {
				status: res.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	} catch (error) {
		console.error('Error fetching recruitment settings:', error);
		return new Response(JSON.stringify({
			error: 'Failed to fetch recruitment settings'
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};

export const PUT: RequestHandler = async ({ params, cookies, request, fetch }) => {
	const projectId = validateId(params.id);

	if (!projectId) {
		return new Response(JSON.stringify({
			error: 'Invalid project ID'
		}), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		let requestData;
		const contentType = request.headers.get('content-type');

		if (contentType && contentType.includes('application/json')) {
			const requestText = await request.text();
			console.log('Raw request text:', requestText);

			try {
				requestData = JSON.parse(requestText);
			} catch (parseError) {
				console.error('JSON parse error:', parseError);
				return new Response(JSON.stringify({
					error: 'Invalid JSON in request body'
				}), {
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		} else {
			requestData = await request.formData();
			requestData = Object.fromEntries(requestData);
		}

		console.log('Parsed request data:', requestData);

		const validatedData = {
			follow_up_days: Number(requestData.follow_up_days),
			auto_follow_up_enabled: Boolean(requestData.auto_follow_up_enabled)
		};

		if (isNaN(validatedData.follow_up_days) || validatedData.follow_up_days < 1 || validatedData.follow_up_days > 30) {
			return new Response(JSON.stringify({
				error: 'Follow-up days must be a number between 1 and 30'
			}), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		console.log('Sending validated data to backend:', validatedData);

		const res = await fetch(`${API_URL}/projects/${projectId}/management/recruitment/settings`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				authorization: `${await getToken(cookies)}`
			},
			body: JSON.stringify(validatedData)
		});

		const responseText = await res.text();
		console.log('Backend response status:', res.status);
		console.log('Backend response text:', responseText);

		if (res.ok) {
			try {
				const data = JSON.parse(responseText);
				return new Response(JSON.stringify(data), {
					status: 200,
					headers: { 'Content-Type': 'application/json' }
				});
			} catch (parseError) {
				console.error('Failed to parse update response:', parseError);
				return new Response(JSON.stringify({
					error: 'Invalid response format from server'
				}), {
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				});
			}
		} else {
			console.error('Settings update failed:', res.status, responseText);

			let errorMessage = 'Failed to update settings';
			try {
				const errorData = JSON.parse(responseText);
				errorMessage = errorData.error || errorData.message || errorMessage;
			} catch {
				errorMessage = `HTTP ${res.status}: ${responseText}`;
			}

			return new Response(JSON.stringify({
				error: errorMessage
			}), {
				status: res.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	} catch (error) {
		console.error('Error updating recruitment settings:', error);
		return new Response(JSON.stringify({
			error: error.message || 'Failed to update recruitment settings'
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};