// src/routes/api/filesystem/shared/[token]/download/[fileId]/+server.ts
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, fetch }) => {
	try {
		console.log('📥 Shared file download request:', params.token, params.fileId);

		const response = await fetch(`${API_URL}/shared/folders/${params.token}/download/${params.fileId}`, {
			method: 'GET'
		});

		if (!response.ok) {
			console.error('❌ Shared download failed:', response.status);
			return new Response(JSON.stringify({
				error: 'Download failed',
				status: response.status
			}), {
				status: response.status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const stream = response.body;
		if (!stream) {
			return new Response('No file content available', { status: 500 });
		}

		// Forward headers
		const responseHeaders = new Headers();
		const headersToForward = [
			'content-type',
			'content-length',
			'content-disposition',
			'cache-control',
			'last-modified',
			'etag'
		];

		headersToForward.forEach(header => {
			const value = response.headers.get(header);
			if (value) {
				responseHeaders.set(header, value);
			}
		});

		// CORS headers
		responseHeaders.set('Access-Control-Allow-Origin', '*');
		responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
		responseHeaders.set('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length, Content-Type');

		console.log('✅ Shared download started');

		return new Response(stream, {
			status: 200,
			headers: responseHeaders
		});

	} catch (error) {
		console.error('❌ Error in shared download:', error);
		return new Response(JSON.stringify({
			error: 'Download error',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};