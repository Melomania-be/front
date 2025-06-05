import ConfirmModal from '$lib/components/ConfirmModal.svelte';

export function confirmDialog(message: string): Promise<boolean> {
	return new Promise((resolve) => {
		const modal = new ConfirmModal({
			target: document.body,
			props: {
				message,
				onConfirm: () => {
					modal.$destroy();
					resolve(true);
				},
				onCancel: () => {
					modal.$destroy();
					resolve(false);
				}
			}
		});
	});
}
