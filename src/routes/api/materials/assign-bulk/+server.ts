// F:\Java\front\src\routes\api\materials\assign-bulk\+server.ts
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const POST: RequestHandler = async ({ cookies, request, fetch }) => {
    try {
        const data = await request.json();

        console.log('🔍 Frontend: Bulk assignment request received');
        console.log('📊 Data structure:', {
            assignments: data.assignments?.length || 0,
            sampleAssignment: data.assignments?.[0]
        });

        // Valider la structure des données
        if (!data.assignments || !Array.isArray(data.assignments)) {
            console.error('❌ Invalid data structure - assignments missing or not array');
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid data: assignments array is required'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Valider chaque assignment
        for (const assignment of data.assignments) {
            if (!assignment.projectId || !assignment.pieceId) {
                console.error('❌ Invalid assignment:', assignment);
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Invalid assignment: projectId and pieceId are required'
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        console.log('✅ Data validation passed, sending to backend...');

        const res = await fetch(`${API_URL}/materials/assign-bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                authorization: `${await getToken(cookies)}`
            },
            body: JSON.stringify(data)
        });

        console.log('📡 Backend response status:', res.status);

        if (!res.ok) {
            const errorText = await res.text();
            console.error('❌ Backend error response:', errorText);

            // Essayer de parser l'erreur JSON si possible
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch {
                errorData = { error: errorText };
            }

            return new Response(JSON.stringify({
                success: false,
                error: 'Backend error',
                details: errorData,
                status: res.status
            }), {
                status: res.status,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Lire et logger la réponse de succès
        const responseText = await res.text();
        console.log('✅ Backend success response:', responseText);

        return new Response(responseText, {
            status: res.status,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('💥 Error in assign-bulk route:', error);

        return new Response(JSON.stringify({
            success: false,
            error: 'Internal server error',
            details: error.message,
            stack: error.stack
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};