import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
    return { id: params.id, callsheetId: params.callsheetId}
};