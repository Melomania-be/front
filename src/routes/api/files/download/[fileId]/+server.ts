// src/routes/api/files/download/[fileId]/+server.ts
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, fetch, url }) => {
    try {
        console.log('📥 API Route - Download request for file:', params.fileId);

        // Faire la requête vers le backend AdonisJS
        const response = await fetch(`${API_URL}/files/download/${params.fileId}`, {
            method: 'GET'
        });

        console.log('📥 Backend response status:', response.status);

        if (!response.ok) {
            console.error('❌ Backend download failed:', response.status);
            return new Response(JSON.stringify({
                error: 'Download failed',
                status: response.status
            }), {
                status: response.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Récupérer le stream depuis le backend
        const stream = response.body;

        if (!stream) {
            console.error('❌ No stream received from backend for download');
            return new Response('No file content available', { status: 500 });
        }

        // Construire les headers de réponse pour le téléchargement
        const responseHeaders = new Headers();

        // Copier les headers importants du backend
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

        // S'assurer que le téléchargement est forcé
        if (!responseHeaders.has('content-disposition')) {
            responseHeaders.set('Content-Disposition', 'attachment');
        }

        // Headers CORS
        responseHeaders.set('Access-Control-Allow-Origin', '*');
        responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        responseHeaders.set('Access-Control-Expose-Headers', 'Content-Disposition, Content-Length, Content-Type');

        console.log('✅ Download started for file:', params.fileId);

        // Retourner le stream pour téléchargement
        return new Response(stream, {
            status: 200,
            headers: responseHeaders
        });

    } catch (error) {
        console.error('❌ Error in download API route:', error);
        return new Response(JSON.stringify({
            error: 'Download error',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
