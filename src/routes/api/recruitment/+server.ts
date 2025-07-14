import { getToken } from '$lib/server/authentification';
import { type RequestHandler } from '@sveltejs/kit';
import { API_URL } from '$env/static/private'; // Make sure API_URL includes http://localhost:3333

const RECRUITMENTS_API_ENDPOINT = `${API_URL}/recruitments`;
const RECRUITMENTS_ADVANCED_SEARCH_ENDPOINT = `${API_URL}/recruitments/search/advanced`; // Assuming you might use this for POST filtering

// export const GET: RequestHandler = async ({ cookies, fetch }) => {
// 	const res = await fetch(RECRUITMENTS_API_ENDPOINT, {
// 		// Corrected URL
// 		method: 'GET',
// 		headers: {
// 			authorization: `${await getToken(cookies)}`
// 		}
// 	});

// 	// Optional: Basic error handling
// 	if (!res.ok) {
// 		console.error(`Backend GET error (${res.status}):`, await res.text());
// 		// Depending on your frontend error handling, you might re-throw or return a new Response
// 		// For simple proxying, returning res directly propagates the status and body
// 	}

// 	return res;
// };

export const GET: RequestHandler = async ({ cookies, fetch, url }) => {
	const res = await fetch(`${RECRUITMENTS_API_ENDPOINT}${url.search}`, {
		method: 'GET',
		headers: {
			authorization: `${await getToken(cookies)}`
		}
	});

	if (!res.ok) {
		console.error(`Backend GET error (${res.status}):`, await res.text());
		return new Response('Failed to fetch recruitments', { status: res.status });
	}

	const data = await res.json();
	return new Response(JSON.stringify(data), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	});
};

export const POST: RequestHandler = async ({ cookies, fetch, request }) => {
	const data = await request.json();

	const res = await fetch(RECRUITMENTS_API_ENDPOINT, {
		// Corrected URL
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			authorization: `${await getToken(cookies)}` // UNCOMMENTED
		},
		body: JSON.stringify(data)
	});

	// Optional: Basic error handling
	if (!res.ok) {
		console.error(`Backend POST error (${res.status}):`, await res.text());
	}

	return res;
};

// If you have a separate POST for advanced search, it might look like this:
/*
export const POST_ADVANCED_SEARCH: RequestHandler = async ({ cookies, fetch, request }) => {
    const filters = await request.json(); // Filters including projectId
    const res = await fetch(RECRUITMENTS_ADVANCED_SEARCH_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            authorization: `${await getToken(cookies)}`
        },
        body: JSON.stringify(filters)
    });

    if (!res.ok) {
        console.error(`Backend Advanced Search error (${res.status}):`, await res.text());
        const errorBody = await res.text();
        return new Response(errorBody, { status: res.status, headers: { 'Content-Type': 'application/json' } });
    }

    return res;
};
*/
