<!-- src/lib/components/filesystem/ShareFolderModal.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { X, Share2, Copy, ExternalLink, Users, Check, MessageCircle, Send, ShieldOff, AlertTriangle } from 'lucide-svelte';
	import type { FileSystemItem } from '$lib/types/FileSystem';

	const dispatch = createEventDispatcher();

	export let folder: FileSystemItem;
	export let isVisible = false;

	let shareUrl = '';
	let isGenerating = false;
	let copySuccess = false;
	let shareData: any = null;
	let isRevoking = false;
	let showRevokeConfirm = false;

	$: if (isVisible && folder) {
		generateShareUrl();
	}

	async function generateShareUrl() {
		if (isGenerating) return;

		isGenerating = true;
		try {
			const response = await fetch(`/api/filesystem/folders/${folder.id}/share`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			if (response.ok) {
				const data = await response.json();
				shareData = data;
				shareUrl = `${window.location.origin}/shared/folders/${data.token}`;
			}
		} catch (error) {
			console.error('Error generating share URL:', error);
		}
		isGenerating = false;
	}

	async function revokeShare() {
		if (isRevoking) return;

		isRevoking = true;
		try {
			const response = await fetch(`/api/filesystem/folders/${folder.id}/share`, {
				method: 'DELETE'
			});

			if (response.ok) {
				shareUrl = '';
				shareData = null;
				showRevokeConfirm = false;

				// Optionnel: fermer le modal après révocation
				setTimeout(() => {
					close();
				}, 1000);
			} else {
				alert('Failed to revoke share link');
			}
		} catch (error) {
			console.error('Error revoking share:', error);
			alert('Error revoking share link');
		}
		isRevoking = false;
	}

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			copySuccess = true;
			setTimeout(() => copySuccess = false, 2000);
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
		}
	}

	function shareWhatsApp() {
		if (shareUrl) {
			const message = encodeURIComponent(`Check out this shared folder: ${folder.name}\n${shareUrl}`);
			window.open(`https://wa.me/?text=${message}`, '_blank');
		}
	}

	function shareMessenger() {
		if (shareUrl) {
			const message = encodeURIComponent(`Check out this shared folder: ${folder.name}\n${shareUrl}`);
			window.open(`https://m.me/?text=${message}`, '_blank');
		}
	}

	function close() {
		isVisible = false;
		showRevokeConfirm = false;
		dispatch('close');
	}

	function openInNewTab() {
		if (shareUrl) {
			window.open(shareUrl, '_blank');
		}
	}

	function getFolderPath() {
		if (folder.projectId) {
			return `Project folder`;
		} else if (folder.pieceId) {
			return `Piece folder`;
		} else {
			return `General folder`;
		}
	}
</script>

{#if isVisible}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-[10px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-[#6B9AD9] rounded-[8px] flex items-center justify-center">
						<Share2 size={20} class="text-white" />
					</div>
					<div>
						<h1 class="font-bold text-lg text-gray-800">SHARE FOLDER</h1>
						<p class="text-sm text-gray-600">{folder.name}</p>
					</div>
				</div>
				<button
					class="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
					on:click={close}
				>
					<X size={20} />
				</button>
			</div>

			<!-- Content -->
			<div class="p-6 space-y-6">
				<!-- Folder Info -->
				<div class="bg-gray-50 border-2 border-gray-200 rounded-[8px] p-4">
					<div class="flex items-center gap-3">
						<div class="w-12 h-12 bg-blue-100 rounded-[8px] flex items-center justify-center">
							<Users size={24} class="text-blue-600" />
						</div>
						<div>
							<h3 class="font-bold text-gray-800">{folder.name}</h3>
							<p class="text-sm text-gray-600">{getFolderPath()}</p>
							{#if shareData}
								<div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
									<div class="flex items-center gap-1">
										<span>Created: {new Date(shareData.createdAt).toLocaleDateString()}</span>
									</div>
									<div class="flex items-center gap-1">
										<span>Views: {shareData.viewCount || 0}</span>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>

				{#if shareUrl}
					<!-- Share URL Section -->
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<h3 class="font-bold text-gray-800 flex items-center gap-2">
								<ExternalLink size={16} />
								SHARE LINK
							</h3>
							<button
								class="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
								on:click={() => showRevokeConfirm = true}
								title="Revoke share link"
							>
								<ShieldOff size={14} />
								Revoke Link
							</button>
						</div>

						<div class="bg-blue-50 border-2 border-blue-200 rounded-[8px] p-4">
							<div class="flex items-center gap-3">
								<div class="flex-1 bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 break-all">
									{shareUrl}
								</div>
								<div class="flex gap-2">
									<button
										class="p-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
										on:click={copyToClipboard}
										title="Copy link"
									>
										{#if copySuccess}
											<Check size={16} />
										{:else}
											<Copy size={16} />
										{/if}
									</button>
									<button
										class="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
										on:click={openInNewTab}
										title="Open in new tab"
									>
										<ExternalLink size={16} />
									</button>
								</div>
							</div>
							{#if copySuccess}
								<p class="text-sm text-green-600 mt-2 flex items-center gap-1">
									<Check size={14} />
									Link copied to clipboard!
								</p>
							{/if}
						</div>

						<div class="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
							<strong>Note:</strong> Anyone with this link can view the folder contents. The link remains active until you revoke it.
						</div>
					</div>

					<!-- Share via Social Media -->
					<div class="space-y-4">
						<h3 class="font-bold text-gray-800 flex items-center gap-2">
							<Send size={16} />
							SHARE VIA
						</h3>

						<div class="grid grid-cols-2 gap-3">
							<button
								class="flex items-center gap-3 p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
								on:click={shareWhatsApp}
							>
								<MessageCircle size={20} />
								<span class="font-medium">WhatsApp</span>
							</button>

							<button
								class="flex items-center gap-3 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
								on:click={shareMessenger}
							>
								<Send size={20} />
								<span class="font-medium">Messenger</span>
							</button>
						</div>
					</div>
				{:else if isGenerating}
					<!-- Loading State -->
					<div class="flex items-center justify-center p-8">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B9AD9]"></div>
						<span class="ml-3 text-gray-600">Generating share link...</span>
					</div>
				{:else}
					<!-- No share link available -->
					<div class="text-center p-8">
						<ShieldOff size={48} class="text-gray-400 mx-auto mb-4" />
						<h3 class="font-bold text-lg text-gray-700 mb-2">NO ACTIVE SHARE LINK</h3>
						<p class="text-gray-500 mb-4">Create a new share link to allow others to access this folder</p>
						<button
							class="px-6 py-3 bg-[#6B9AD9] text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
							on:click={generateShareUrl}
						>
							Create Share Link
						</button>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
				<div class="text-sm text-gray-600">
					Share settings can be managed from the folder menu
				</div>
				<button
					class="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
					on:click={close}
				>
					Close
				</button>
			</div>
		</div>
	</div>

	<!-- Revoke Confirmation Modal -->
	{#if showRevokeConfirm}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
			<div class="bg-white rounded-[10px] shadow-2xl max-w-md w-full">
				<div class="p-6">
					<div class="flex items-center gap-3 mb-4">
						<div class="w-12 h-12 bg-red-100 rounded-[8px] flex items-center justify-center">
							<AlertTriangle size={24} class="text-red-600" />
						</div>
						<div>
							<h3 class="font-bold text-lg text-gray-800">REVOKE SHARE LINK</h3>
							<p class="text-sm text-gray-600">This action cannot be undone</p>
						</div>
					</div>

					<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
						<p class="text-sm text-red-800">
							<strong>Warning:</strong> Revoking this link will immediately block access for anyone who has it.
							They will no longer be able to view the shared folder.
						</p>
					</div>

					<div class="flex gap-3">
						<button
							class="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
							on:click={() => showRevokeConfirm = false}
							disabled={isRevoking}
						>
							Cancel
						</button>
						<button
							class="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
							on:click={revokeShare}
							disabled={isRevoking}
						>
							{#if isRevoking}
								<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
								Revoking...
							{:else}
								<ShieldOff size={16} />
								Revoke Link
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}
{/if}

<style>
    @media (max-width: 768px) {
        .max-w-2xl {
            max-width: 95vw;
        }

        .flex-col {
            flex-direction: column;
        }

        .gap-2 {
            gap: 0.5rem;
        }
    }
</style>