
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private';

export const DELETE: RequestHandler = async ({ params, fetch }) => {
	const res = await fetch(`${API_URL}/audition/${params.token}/files/${params.fileId}`, {
		method: 'DELETE'
	});

	return res;
};