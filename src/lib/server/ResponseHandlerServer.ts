import { error, fail, redirect, type Cookies } from '@sveltejs/kit';
import {
	StatusCodesClientError,
	StatusCodesRedirection,
	StatusCodesServerError,
	StatusCodesSuccess
} from '$lib/common/statusCodes';

export default class ResponseHandlerServer {
	/** @param {Response} response
	 * @param {Cookies} cookies
	 * @param {() => Promise<void> | void} successCallback */

	async handle(response: Response, cookies: Cookies, successCallback?: () => Promise<void> | void) {
		/* May be a temporary check */
		if (Object.values(StatusCodesSuccess).includes(response.status)) {
			if (successCallback === undefined) return;
			await successCallback();
		} else if (Object.values(StatusCodesClientError).includes(response.status)) {
			await this.handleError(response, cookies);
		} else if (Object.values(StatusCodesServerError).includes(response.status)) {
			await this.handleError(response, cookies);
		}

		return;
	}

	async handleError(response: Response, cookies: Cookies) {
		switch (response.status) {
			case StatusCodesClientError.BAD_REQUEST:
				break;
			case StatusCodesClientError.UNAUTHORIZED:
				cookies.delete('Authorization', { path: '/' });
				redirect(StatusCodesRedirection.TEMPORARY_REDIRECT, '/login');
			case StatusCodesClientError.METHOD_NOT_ALLOWED:
				break;
			case StatusCodesClientError.NOT_ACCEPTABLE:
				break;
			case StatusCodesClientError.UNSUPPORTED_MEDIA_TYPE:
				break;
		}
		error(response.status, await response.text());
	}
}
