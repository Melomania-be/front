<!-- src/lib/components/filesystem/SharedFolderViewer.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Folder,
		File,
		Download,
		Eye,
		ArrowLeft,
		Calendar,
		FileText,
		Image,
		Music,
		Video,
		ExternalLink,
		Shield,
		AlertTriangle,
		Lock,
		XCircle
	} from 'lucide-svelte';
	import type { FileSystemItem } from '$lib/types/FileSystem';
	import FilePreview from './FilePreview.svelte';

	export let token: string;

	let folderData: any = null;
	let currentFolder: FileSystemItem | null = null;
	let breadcrumbs: { id: number; name: string }[] = [];
	let isLoading = true;
	let error = '';
	let showPreview = false;
	let previewFile: FileSystemItem | null = null;
	let sharedRootFolder: FileSystemItem | null = null;
	let isAtSharedRoot = true;
	let isRevoked = false;

	onMount(async () => {
		await loadSharedFolder();
	});

	async function loadSharedFolder() {
		try {
			const response = await fetch(`/api/filesystem/shared/${token}`);

			if (response.ok) {
				const data = await response.json();
				folderData = data;
				currentFolder = data.folder;
				sharedRootFolder = data.folder;
				isAtSharedRoot = true;
				isRevoked = false;

				if (currentFolder && currentFolder.children) {
					// Folder has content
				} else {
					if (currentFolder) {
						currentFolder.children = [];
					}
				}

				buildBreadcrumbs(currentFolder);
			} else if (response.status === 404) {
				error = 'Shared folder not found or link has expired';
			} else if (response.status === 403) {
				const errorData = await response.json().catch(() => ({}));
				if (errorData.revoked || errorData.error?.includes('revoked') || errorData.error?.includes('expired')) {
					isRevoked = true;
					error = errorData.error || 'This share link has been revoked or expired';
				} else {
					error = 'Access denied to this shared folder';
				}
			} else {
				error = 'Failed to load shared folder';
			}
		} catch (err) {
			error = 'Network error loading shared folder';
		}
		isLoading = false;
	}

	async function navigateToSubfolder(subfolder: FileSystemItem) {
		try {
			const response = await fetch(`/api/filesystem/shared/${token}/folder/${subfolder.id}`);

			if (response.ok) {
				const data = await response.json();
				currentFolder = data;
				isAtSharedRoot = false;

				if (!currentFolder.children) {
					currentFolder.children = [];
				}

				buildBreadcrumbs(currentFolder);
			} else if (response.status === 403) {
				const errorData = await response.json().catch(() => ({}));
				if (errorData.revoked || errorData.error?.includes('revoked') || errorData.error?.includes('expired')) {
					isRevoked = true;
					error = errorData.error || 'This share link has been revoked';
					return;
				}
				alert('Access denied to this folder');
			}
		} catch (err) {
			console.error('Error navigating to subfolder:', err);
		}
	}

	function buildBreadcrumbs(folder: FileSystemItem) {
		breadcrumbs = [];

		if (sharedRootFolder) {
			breadcrumbs.push({ id: sharedRootFolder.id, name: sharedRootFolder.name });

			if (!isAtSharedRoot && folder && folder.id !== sharedRootFolder.id) {
				breadcrumbs.push({ id: folder.id, name: folder.name });
			}
		}
	}

	function goBack() {
		if (sharedRootFolder && currentFolder && currentFolder.id !== sharedRootFolder.id) {
			currentFolder = sharedRootFolder;
			isAtSharedRoot = true;
			buildBreadcrumbs(currentFolder);
		}
	}

	function handleItemClick(item: FileSystemItem) {
		if (item.type === 'folder') {
			navigateToSubfolder(item);
		} else {
			previewFile = item;
			showPreview = true;
		}
	}

	async function downloadFile(item: FileSystemItem) {
		if (item.type === 'file') {
			try {
				const response = await fetch(`/api/filesystem/shared/${token}/download/${item.id}`);
				if (response.ok) {
					const blob = await response.blob();
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = item.name;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(url);
				} else if (response.status === 403) {
					const errorData = await response.json().catch(() => ({}));
					if (errorData.revoked || errorData.error?.includes('revoked') || errorData.error?.includes('expired')) {
						isRevoked = true;
						error = errorData.error || 'This share link has been revoked';
						return;
					}
					alert('Download failed - Access denied');
				} else {
					alert('Download failed');
				}
			} catch (error) {
				alert('Download failed');
			}
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function getFileIcon(item: FileSystemItem) {
		if (item.type === 'folder') return Folder;

		const extension = item.name.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'pdf':
			case 'doc':
			case 'docx':
				return FileText;
			case 'jpg':
			case 'jpeg':
			case 'png':
			case 'gif':
			case 'webp':
				return Image;
			case 'mp3':
			case 'wav':
			case 'flac':
				return Music;
			case 'mp4':
			case 'avi':
			case 'mov':
				return Video;
			default:
				return File;
		}
	}

	function getFileColor(item: FileSystemItem): string {
		if (item.type === 'folder') return 'text-blue-600';

		const extension = item.name.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'pdf':
				return 'text-red-600';
			case 'jpg':
			case 'jpeg':
			case 'png':
			case 'gif':
			case 'webp':
				return 'text-green-600';
			case 'mp3':
			case 'wav':
			case 'flac':
				return 'text-purple-600';
			case 'mp4':
			case 'avi':
			case 'mov':
				return 'text-orange-600';
			default:
				return 'text-gray-700';
		}
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="min-h-screen bg-[#E7E7E7]">
	<!-- Header -->
	<div class="bg-white border-b-2 border-[#8C8C8C] shadow-sm">
		<div class="max-w-6xl mx-auto px-4 py-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-[#6B9AD9] rounded-[8px] flex items-center justify-center">
						{#if isRevoked}
							<XCircle size={20} class="text-white" />
						{:else}
							<Shield size={20} class="text-white" />
						{/if}
					</div>
					<div>
						<h1 class="font-bold text-xl text-gray-800">
							{#if isRevoked}
								SHARE LINK REVOKED
							{:else}
								SHARED FOLDER
							{/if}
						</h1>
						<p class="text-sm text-gray-600">
							{#if isRevoked}
								Access has been revoked
							{:else}
								Read-only access
							{/if}
						</p>
					</div>
				</div>
				{#if folderData && !isRevoked}
					<div class="text-sm text-gray-500 flex items-center gap-4">
						<div class="flex items-center gap-1">
							<Calendar size={14} />
							<span>Shared: {folderData.shareInfo ? new Date(folderData.shareInfo.createdAt).toLocaleDateString() : 'Unknown'}</span>
						</div>
						<div class="flex items-center gap-1">
							<Eye size={14} />
							<span>{folderData.shareInfo ? folderData.shareInfo.viewCount : 0} views</span>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<div class="max-w-6xl mx-auto p-4">
		{#if isLoading}
			<!-- Loading State -->
			<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
				<div class="flex justify-center items-center h-64">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B9AD9]"></div>
					<span class="ml-4 text-gray-600 font-semibold">Loading shared folder...</span>
				</div>
			</div>
		{:else if isRevoked}
			<!-- Revoked State -->
			<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
				<div class="text-center py-12">
					<div class="w-20 h-20 bg-red-100 rounded-[10px] flex items-center justify-center mx-auto mb-6">
						<XCircle class="text-red-600" size={48} />
					</div>
					<h3 class="font-bold text-2xl text-red-700 mb-4">SHARE LINK REVOKED</h3>
					<p class="text-red-600 mb-6 text-lg">This share link has been revoked by the administrator and is no longer accessible.</p>
					<div class="bg-red-50 border-2 border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
						<div class="flex items-start gap-4">
							<AlertTriangle class="text-red-600 flex-shrink-0 mt-1" size={24} />
							<div class="text-left">
								<h4 class="font-bold text-red-800 mb-3 text-lg">What happened?</h4>
								<p class="text-red-700 mb-4">
									The person who shared this folder has revoked access. This means the content is no longer available through this link.
								</p>
								<p class="text-red-600 font-medium">
									Please contact the administrators if you need access to this content.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		{:else if error}
			<!-- Error State -->
			<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
				<div class="text-center py-12">
					<div class="w-16 h-16 bg-red-100 rounded-[10px] flex items-center justify-center mx-auto mb-4">
						<Shield class="text-red-600" size={48} />
					</div>
					<h3 class="font-bold text-lg text-red-700 mb-2">ACCESS ERROR</h3>
					<p class="text-red-600 mb-4">{error}</p>
					<p class="text-sm text-gray-500">Please check your link or contact the person who shared this folder.</p>
				</div>
			</div>
		{:else}
			<!-- Breadcrumbs -->
			{#if !isAtSharedRoot && breadcrumbs.length > 1}
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4 mb-4">
					<div class="flex items-center gap-3">
						<button
							class="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-300 transition-colors font-semibold"
							on:click={goBack}
						>
							<ArrowLeft size={16} />
							Back to {sharedRootFolder?.name || 'Shared Folder'}
						</button>
						<div class="h-6 w-px bg-gray-300"></div>
						<nav class="flex items-center gap-2">
							{#each breadcrumbs as breadcrumb, i}
								<span class="text-gray-700 font-semibold {i === breadcrumbs.length - 1 ? 'text-[#6B9AD9]' : ''}">
									{breadcrumb.name}
								</span>
								{#if i < breadcrumbs.length - 1}
									<span class="text-gray-400">/</span>
								{/if}
							{/each}
						</nav>
					</div>
				</div>
			{/if}

			<!-- Folder Contents -->
			{#if currentFolder && currentFolder.children && currentFolder.children.length > 0}
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
					<div class="flex items-center space-x-3 mb-6">
						<div class="flex items-center justify-center w-10 h-10 bg-[#6B9AD9] rounded-[8px]">
							<Folder class="w-5 h-5 text-white" />
						</div>
						<div>
							<h1 class="font-bold text-lg">{currentFolder.name}</h1>
							<p class="text-sm text-gray-600">{currentFolder.children.length} item{currentFolder.children.length !== 1 ? 's' : ''}</p>

							{#if !isAtSharedRoot && sharedRootFolder}
								<p class="text-xs text-blue-600 mt-1">
									Subfolder of "{sharedRootFolder.name}"
								</p>
							{/if}
						</div>
					</div>

					<div class="space-y-4">
						{#each currentFolder.children as item}
							<div class="border-2 border-[#8C8C8C] rounded-[10px] overflow-hidden hover:bg-gray-50 transition-all duration-200">
								<!-- Desktop Layout -->
								<div class="hidden md:flex items-center justify-between p-4 cursor-pointer group">
									<div
										class="flex items-center gap-4 flex-1 min-w-0"
										on:click={() => handleItemClick(item)}
										role="button"
										tabindex="0"
									>
										<!-- Icon -->
										<div class="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-[8px] border-2 border-gray-300 group-hover:border-[#6B9AD9] transition-colors flex items-center justify-center">
											<svelte:component this={getFileIcon(item)} size={24} class={getFileColor(item)} />
										</div>

										<!-- File Info -->
										<div class="flex-1 min-w-0 overflow-hidden">
											<div class="flex items-center justify-between mb-2">
												<h3 class="font-bold text-gray-900 truncate" title={item.name}>{item.name}</h3>
												<div class="flex items-center gap-2 text-xs">
													{#if item.type === 'file'}
														<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold border border-blue-300">
															{formatFileSize(item.size || 0)}
														</span>
													{:else}
														<span class="bg-green-100 text-green-800 px-2 py-1 rounded font-semibold border border-green-300">
															FOLDER
														</span>
													{/if}
												</div>
											</div>

											<div class="grid grid-cols-3 gap-4 text-sm overflow-hidden">
												<div class="min-w-0">
													<span class="font-medium text-gray-700">Type:</span>
													<span class="text-gray-600 block break-words">
														{#if item.type === 'file'}
															{item.name.split('.').pop()?.toUpperCase() || 'FILE'}
														{:else}
															Folder
														{/if}
													</span>
												</div>
												<div class="min-w-0">
													<span class="font-medium text-gray-700">Modified:</span>
													<span class="text-gray-600 block">{formatDate(item.updatedAt)}</span>
												</div>
												<div class="min-w-0">
													<!-- Placeholder -->
												</div>
											</div>
										</div>
									</div>

									<!-- Desktop Actions -->
									<div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
										{#if item.type === 'file'}
											<button
												class="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-300 transition-colors"
												on:click|stopPropagation={() => {
													previewFile = item;
													showPreview = true;
												}}
												title="Preview"
											>
												<Eye size={16} />
											</button>

											<button
												class="p-2 text-gray-600 hover:text-green-600 rounded-lg hover:bg-green-50 border border-transparent hover:border-green-300 transition-colors"
												on:click|stopPropagation={() => downloadFile(item)}
												title="Download"
											>
												<Download size={16} />
											</button>
										{:else}
											<button
												class="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-300 transition-colors"
												on:click|stopPropagation={() => navigateToSubfolder(item)}
												title="Open folder"
											>
												<ExternalLink size={16} />
											</button>
										{/if}
									</div>
								</div>

								<!-- Mobile Layout -->
								<div class="md:hidden p-4 space-y-4">
									<!-- Item Header -->
									<div
										class="flex items-center gap-4 cursor-pointer"
										on:click={() => handleItemClick(item)}
										role="button"
										tabindex="0"
									>
										<!-- Icon -->
										<div class="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-[8px] border-2 border-gray-300 transition-colors flex items-center justify-center">
											<svelte:component this={getFileIcon(item)} size={24} class={getFileColor(item)} />
										</div>

										<!-- File Info -->
										<div class="flex-1 min-w-0 overflow-hidden">
											<div class="flex items-center justify-between mb-2">
												<h3 class="font-bold text-gray-900 truncate" title={item.name}>{item.name}</h3>
												<div class="flex items-center gap-2 text-xs">
													{#if item.type === 'file'}
														<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold border border-blue-300">
															{formatFileSize(item.size || 0)}
														</span>
													{:else}
														<span class="bg-green-100 text-green-800 px-2 py-1 rounded font-semibold border border-green-300">
															FOLDER
														</span>
													{/if}
												</div>
											</div>

											<div class="space-y-2 text-sm">
												<div>
													<span class="font-medium text-gray-700">Type:</span>
													<span class="text-gray-600 ml-2">
														{#if item.type === 'file'}
															{item.name.split('.').pop()?.toUpperCase() || 'FILE'}
														{:else}
															Folder
														{/if}
													</span>
												</div>
												<div>
													<span class="font-medium text-gray-700">Modified:</span>
													<span class="text-gray-600 ml-2">{formatDate(item.updatedAt)}</span>
												</div>
											</div>
										</div>
									</div>

									<!-- Mobile Actions - TOUJOURS VISIBLES -->
									{#if item.type === 'file'}
										<div class="flex gap-3 pt-2 border-t border-gray-200">
											<button
												class="flex-1 flex items-center justify-center gap-2 py-3 px-4 text-blue-600 bg-blue-50 rounded-lg border border-blue-300 font-semibold hover:bg-blue-100 transition-colors min-h-[44px]"
												on:click={() => {
													previewFile = item;
													showPreview = true;
												}}
											>
												<Eye size={18} />
												Preview
											</button>

											<button
												class="flex-1 flex items-center justify-center gap-2 py-3 px-4 text-green-600 bg-green-50 rounded-lg border border-green-300 font-semibold hover:bg-green-100 transition-colors min-h-[44px]"
												on:click={() => downloadFile(item)}
											>
												<Download size={18} />
												Download
											</button>
										</div>
									{:else}
										<div class="pt-2 border-t border-gray-200">
											<button
												class="w-full flex items-center justify-center gap-2 py-3 px-4 text-blue-600 bg-blue-50 rounded-lg border border-blue-300 font-semibold hover:bg-blue-100 transition-colors min-h-[44px]"
												on:click={() => navigateToSubfolder(item)}
											>
												<ExternalLink size={18} />
												Open Folder
											</button>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<!-- Empty folder -->
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
					<div class="text-center py-12">
						<div class="w-16 h-16 bg-gray-100 rounded-[10px] flex items-center justify-center mx-auto mb-4">
							<Folder class="text-gray-400" size={48} />
						</div>
						<h3 class="font-bold text-lg text-gray-700 mb-2">FOLDER IS EMPTY</h3>
						<p class="text-gray-500">This shared folder doesn't contain any files or subfolders.</p>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Preview Modal -->
{#if showPreview && previewFile && !isRevoked}
	<FilePreview
		fileId={previewFile.id}
		fileName={previewFile.name}
		fileType={previewFile.mimeType || ''}
		isShared={true}
		shareToken={token}
		onClose={() => {
			showPreview = false;
			previewFile = null;
		}}
	/>
{/if}

<style>
    .break-words {
        word-wrap: break-word;
        word-break: break-word;
        overflow-wrap: break-word;
    }

    .truncate {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .min-w-0 {
        min-width: 0;
    }

    .overflow-hidden {
        overflow: hidden;
    }
</style>