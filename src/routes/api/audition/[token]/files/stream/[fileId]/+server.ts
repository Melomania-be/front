// src/routes/api/files/stream/[fileId]/+server.ts
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, fetch, request }) => {
    try {
        console.log('🎬 API Route - Stream request for file:', params.fileId);

        // Récupérer les headers de la requête originale (pour Range requests)
        const headers = new Headers();
        const rangeHeader = request.headers.get('range');
        if (rangeHeader) {
            headers.set('Range', rangeHeader);
            console.log('📊 Range header found:', rangeHeader);
        }

        // Faire la requête vers le backend AdonisJS
        const response = await fetch(`${API_URL}/files/stream/${params.fileId}`, {
            method: 'GET',
            headers: headers
        });

        console.log('🎬 Backend response status:', response.status);

        // Récupérer le stream depuis le backend
        const stream = response.body;

        if (!stream) {
            console.error('❌ No stream received from backend');
            return new Response('No stream available', { status: 500 });
        }

        // Construire les headers de réponse
        const responseHeaders = new Headers();

        // Copier les headers importants du backend
        const headersToForward = [
            'content-type',
            'content-length',
            'content-range',
            'accept-ranges',
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

        // Headers CORS
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        responseHeaders.set('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');

        console.log('✅ Streaming file with status:', response.status);

        // Retourner le stream avec le bon status code
        return new Response(stream, {
            status: response.status,
            headers: responseHeaders
        });

    } catch (error) {
        console.error('❌ Error in stream API route:', error);
        return new Response(JSON.stringify({
            error: 'Stream error',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};