// src/routes/projects/[id]/management/recruitment/+page.server.ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	return {
		id: params.id
	};
};