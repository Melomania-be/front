// src/routes/api/files/stream/[fileId]/+server.ts
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, fetch, request }) => {
	try {
		const headers = new Headers();
		const rangeHeader = request.headers.get('range');
		if (rangeHeader) {
			headers.set('Range', rangeHeader);
		}

		const response = await fetch(`${API_URL}/files/stream/${params.fileId}`, {
			method: 'GET',
			headers: headers
		});

		const stream = response.body;

		if (!stream) {
			return new Response('No stream available', { status: 500 });
		}

		const responseHeaders = new Headers();

		const headersToForward = [
			'content-type',
			'content-length',
			'content-range',
			'accept-ranges',
			'cache-control',
			'last-modified',
			'etag'
		];

		headersToForward.forEach((header) => {
			const value = response.headers.get(header);
			if (value) {
				responseHeaders.set(header, value);
			}
		});

		responseHeaders.set('Access-Control-Allow-Origin', '*');
		responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
		responseHeaders.set(
			'Access-Control-Expose-Headers',
			'Content-Range, Accept-Ranges, Content-Length'
		);

		return new Response(stream, {
			status: response.status,
			headers: responseHeaders
		});
	} catch (error) {
		return new Response(
			JSON.stringify({
				error: 'Stream error',
				details: error.message
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};
