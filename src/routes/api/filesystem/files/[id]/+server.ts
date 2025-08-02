// src/routes/api/filesystem/files/[id]/+server.ts - VERSION SÉCURISÉE
import { API_URL } from '$env/static/private';
import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';


export const DELETE: RequestHandler = async ({ params, cookies, fetch }) => {
	try {
		console.log('🗑️ Attempting to delete file:', params.id);

		
		// ✅ VÉRIFICATION : S'assurer que le fichier peut être supprimé
		const checkResponse = await fetch(`${API_URL}/filesystem/files/${params.id}/check-deletion`, {
			method: 'GET',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		if (!checkResponse.ok) {
			console.error('❌ Cannot check file deletion permissions');
			return new Response(JSON.stringify({
				error: 'Cannot verify file deletion permissions'
			}), {
				status: 403,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const checkResult = await checkResponse.json();

		// ✅ PROTECTION : Empêcher la suppression de fichiers de projet depuis les fichiers généraux
		if (checkResult.file.projectId || checkResult.file.pieceId) {
			console.error('🚨 Attempted to delete project file from general interface!');
			return new Response(JSON.stringify({
				error: 'Cannot delete project files from general file interface',
				message: 'This file belongs to a project and must be deleted from the project interface'
			}), {
				status: 403,
				headers: { 'Content-Type': 'application/json' }
			});
		}

	

		// ✅ Procéder à la suppression si le fichier est vraiment général
		const response = await fetch(`${API_URL}/filesystem/files/${params.id}`, {
			method: 'DELETE',
			headers: {
				authorization: `${await getToken(cookies)}`
			}
		});

		if (response.ok) {
			console.log('✅ General file deleted successfully');
		} else {
			console.error('❌ File deletion failed:', response.status);
		}

		return response;
	} catch (error) {
		console.error('❌ Error in file deletion:', error);
		return new Response(JSON.stringify({
			error: 'Deletion failed',
			details: error.message
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};