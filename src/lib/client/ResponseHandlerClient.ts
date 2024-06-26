import { StatusCodesClientError, StatusCodesSuccess } from '$lib/common/statusCodes';

export default class ResponseHandlerClient {
	async handle(response: Response, successCallback?: () => Promise<void> | void) {
		if (response.status === StatusCodesClientError.UNAUTHORIZED) {
			window.location.href = '/login';
		}

		if (Object.values(StatusCodesSuccess).includes(response.status)) {
			if (successCallback === undefined) return;
			await successCallback();
		}

		if (Object.values(StatusCodesClientError).includes(response.status)) {
			await this.showError(response);
		}
	}

	async showError(response: Response) {
		const error = await response.text();
		console.error(error);
		alert(error);
	}
}
