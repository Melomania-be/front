<!-- src/lib/components/filesystem/SharedFolderViewer.svelte - VERSION CORRIGÉE -->
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
		Shield
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

	onMount(async () => {
		console.log('🔍 SharedFolderViewer mounted with token:', token);
		await loadSharedFolder();
	});

	async function loadSharedFolder() {
		try {
			console.log('🔄 Loading shared folder...');
			const response = await fetch(`/api/filesystem/shared/${token}`);

			console.log('📡 Response status:', response.status);

			if (response.ok) {
				const data = await response.json();
				console.log('✅ Shared folder data received:', data);

				folderData = data;
				currentFolder = data.folder;

				// ✅ CORRECTION : Vérifier si les children existent
				if (currentFolder && currentFolder.children) {
					console.log(`📂 Folder has ${currentFolder.children.length} children`);
				} else {
					console.log('⚠️ Folder has no children or children is undefined');
					// S'assurer que children est un tableau vide
					if (currentFolder) {
						currentFolder.children = [];
					}
				}

				buildBreadcrumbs(currentFolder);
			} else if (response.status === 404) {
				error = 'Shared folder not found or link has expired';
			} else if (response.status === 403) {
				error = 'Access denied to this shared folder';
			} else {
				error = 'Failed to load shared folder';
			}
		} catch (err) {
			error = 'Network error loading shared folder';
			console.error('❌ Error loading shared folder:', err);
		}
		isLoading = false;
	}

	async function navigateToSubfolder(subfolder: FileSystemItem) {
		try {
			console.log('🔄 Navigating to subfolder:', subfolder.name);
			const response = await fetch(`/api/filesystem/shared/${token}/folder/${subfolder.id}`);

			if (response.ok) {
				const data = await response.json();
				console.log('✅ Subfolder data received:', data);

				currentFolder = data;

				// ✅ CORRECTION : S'assurer que children existe
				if (!currentFolder.children) {
					currentFolder.children = [];
				}

				buildBreadcrumbs(currentFolder);
			} else {
				console.error('❌ Failed to load subfolder');
			}
		} catch (err) {
			console.error('❌ Error navigating to subfolder:', err);
		}
	}

	function buildBreadcrumbs(folder: FileSystemItem) {
		// ✅ CORRECTION : Construction simple des breadcrumbs
		breadcrumbs = [{ id: folder.id, name: folder.name }];
	}

	function goBack() {
		// ✅ CORRECTION : Retour simple au dossier racine
		if (folderData && folderData.folder) {
			currentFolder = folderData.folder;
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
				console.log('📥 Downloading file:', item.name);
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
					console.log('✅ Download completed');
				} else {
					console.error('❌ Download failed:', response.status);
					alert('Download failed');
				}
			} catch (error) {
				console.error('❌ Error downloading file:', error);
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
						<Shield size={20} class="text-white" />
					</div>
					<div>
						<h1 class="font-bold text-xl text-gray-800">SHARED FOLDER</h1>
						<p class="text-sm text-gray-600">Read-only access</p>
					</div>
				</div>
				{#if folderData}
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
			<!-- ✅ CORRECTION : Breadcrumbs seulement si pas au niveau racine -->
			{#if breadcrumbs.length > 0 && currentFolder && currentFolder.id !== folderData.folder.id}
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4 mb-4">
					<div class="flex items-center gap-3">
						<button
							class="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-300 transition-colors font-semibold"
							on:click={goBack}
						>
							<ArrowLeft size={16} />
							Back to {folderData.folder.name}
						</button>
						<div class="h-6 w-px bg-gray-300"></div>
						<nav class="flex items-center gap-2">
							<span class="text-gray-500">{folderData.folder.name}</span>
							<span class="text-gray-400">/</span>
							<span class="text-[#6B9AD9] font-semibold">{currentFolder.name}</span>
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
						</div>
					</div>

					<div class="space-y-4">
						{#each currentFolder.children as item}
							<div class="border-2 border-[#8C8C8C] rounded-[10px] overflow-hidden hover:bg-gray-50 transition-all duration-200">
								<div
									class="flex items-center justify-between p-4 cursor-pointer group"
									on:click={() => handleItemClick(item)}
									role="button"
									tabindex="0"
								>
									<div class="flex items-center gap-4 flex-1 min-w-0">
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

											<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm overflow-hidden">
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

									<!-- Actions -->
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
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<!-- ✅ CORRECTION : Empty folder avec debug info -->
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
					<div class="text-center py-12">
						<div class="w-16 h-16 bg-gray-100 rounded-[10px] flex items-center justify-center mx-auto mb-4">
							<Folder class="text-gray-400" size={48} />
						</div>
						<h3 class="font-bold text-lg text-gray-700 mb-2">FOLDER IS EMPTY</h3>
						<p class="text-gray-500">This shared folder doesn't contain any files or subfolders.</p>

						<!-- ✅ DEBUG INFO -->
						{#if currentFolder}
							<div class="mt-4 p-3 bg-gray-100 rounded text-xs text-left">
								<strong>Debug Info:</strong><br>
								Folder ID: {currentFolder.id}<br>
								Folder Name: {currentFolder.name}<br>
								Children Count: {currentFolder.children ? currentFolder.children.length : 'undefined'}<br>
								Children Type: {typeof currentFolder.children}<br>
								Project ID: {currentFolder.projectId || 'null'}<br>
								Piece ID: {currentFolder.pieceId || 'null'}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Preview Modal -->
{#if showPreview && previewFile}
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
    /* Mobile responsiveness */
    @media (max-width: 768px) {
        .md\:grid-cols-3 {
            grid-template-columns: repeat(1, minmax(0, 1fr));
        }

        .gap-4 {
            gap: 0.75rem;
        }

        /* Improve touch targets */
        button {
            min-height: 44px;
        }

        /* Force text wrapping */
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
    }
</style>