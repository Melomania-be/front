// src/routes/api/filesystem/shared/[token]/folder/[folderId]/+server.ts
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, fetch }) => {
	const res = await fetch(`${API_URL}/shared/folders/${params.token}/folder/${params.folderId}`, {
		method: 'GET'
	});
	return res;
};