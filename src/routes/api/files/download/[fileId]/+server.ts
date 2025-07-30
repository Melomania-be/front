// src/routes/api/files/download/[fileId]/+server.ts
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, fetch }) => {
    try {
        const response = await fetch(`${API_URL}/files/download/${params.fileId}`, {
            method: 'GET'
        });

        if (!response.ok) {
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

        if (!responseHeaders.has('content-disposition')) {
            responseHeaders.set('Content-Disposition', 'attachment');
        }

        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        responseHeaders.set('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length, Content-Type');

        return new Response(stream, {
            status: 200,
            headers: responseHeaders
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: 'Download error',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};