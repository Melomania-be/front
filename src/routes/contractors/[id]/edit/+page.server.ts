import type { PageServerLoad } from './$types';
import { getToken } from '$lib/server/authentification';
import { API_URL } from '$env/static/private';

export const load: PageServerLoad = async ({ cookies, params, fetch }) => {
    const res = await fetch(
        `${API_URL}/contractor/${params.id}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                authorization: `${await getToken(cookies)}`
            }
        }
    );

    const contractor = await res.json();

    return {
        contractor
    };
};