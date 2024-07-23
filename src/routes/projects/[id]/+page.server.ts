import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { StatusCodesRedirection } from '$lib/common/statusCodes';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);

	redirect(StatusCodesRedirection.PERMANENT_REDIRECT, `/projects/${id}/management/`);
};
