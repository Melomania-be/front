<!-- src/lib/components/filesystem/FileSystemExplorer.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import {
		File,
		Folder,
		Download,
		Trash2,
		Edit3,
		MoreVertical,
		Music,
		Image,
		Video,
		FileText,
		Eye,
		Package,
		Upload,
		ChevronDown,
		ChevronRight,
		Plus,
		Info,
		X,
		Share2,
		ShieldOff,
		AlertTriangle
	} from 'lucide-svelte';
	import type { FileSystemItem } from '$lib/types/FileSystem';
	import type { Material } from '$lib/types/Material';
	import FilePreview from './FilePreview.svelte';
	import ShareFolderModal from './ShareFolderModal.svelte';
	import { browser } from '$app/environment';

	const dispatch = createEventDispatcher();

	export let items: FileSystemItem[] = [];
	export let showActions = true;
	export let showMaterials = true;
	export let projectId: number | null = null;

	export let deleteAttachment: number | null = null;

	let selectedItem: FileSystemItem | null = null;
	let showContextMenu = false;
	let contextMenuPosition = { x: 0, y: 0 };
	let showPreview = false;
	let previewFile: FileSystemItem | null = null;
	let expandedPieces = new Set<number>();
	let isMobile = false;
	let windowWidth = 0;

	let showShareModal = false;
	let folderToShare: FileSystemItem | null = null;
	let sharedFolders = new Set<number>();
	let showRevokeConfirm = false;
	let folderToRevoke: FileSystemItem | null = null;
	let isRevoking = false;

	let materialsLoading = new Set<number>();

	const checkMobile = () => {
		if (browser) {
			windowWidth = window.innerWidth;
			isMobile = window.innerWidth <= 768;
		}
	};

	// Load share status for folders
	async function checkSharedStatus() {
		for (const item of items) {
			if (item.type === 'folder') {
				try {
					const response = await fetch(`/api/filesystem/folders/${item.id}/share-status`);
					if (response.ok) {
						const data = await response.json();
						if (data.isShared) {
							sharedFolders.add(item.id);
						} else {
							sharedFolders.delete(item.id);
						}
					}
				} catch (error) {
					// Ignore errors for share status check
				}
			}
		}
		sharedFolders = new Set(sharedFolders);
	}

	// Check share status on load
	$: if (items.length > 0) {
		checkSharedStatus();
	}

	async function loadMaterialForPiece(pieceId: number): Promise<{ material: any; files: any[] }> {
		if (materialsLoading.has(pieceId)) {
			return { material: null, files: [] };
		}

		materialsLoading.add(pieceId);

		try {
			const selectedResponse = await fetch(`/api/pieces/${pieceId}/select-material`);

			if (!selectedResponse.ok) {
				return { material: null, files: [] };
			}

			const selectedResult = await selectedResponse.json();

			if (!selectedResult.materialId) {
				return { material: null, files: [] };
			}

			const [materialResponse, filesResponse] = await Promise.all([
				fetch(`/api/materials/${selectedResult.materialId}`),
				fetch(`/api/materials/${selectedResult.materialId}/files`)
			]);

			let material = null;
			let files = [];

			if (materialResponse.ok) {
				material = await materialResponse.json();
			}

			if (filesResponse.ok) {
				const filesData = await filesResponse.json();
				files = Array.isArray(filesData) ? filesData : [];
			}

			materialsLoading.delete(pieceId);
			return { material, files };
		} catch (error) {
			materialsLoading.delete(pieceId);
			return { material: null, files: [] };
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
			case 'svg':
			case 'tiff':
				return Image;
			case 'mp3':
			case 'wav':
			case 'flac':
			case 'aac':
			case 'ogg':
			case 'm4a':
				return Music;
			case 'mp4':
			case 'avi':
			case 'mov':
			case 'mkv':
			case 'webm':
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

	function handleItemClick(item: FileSystemItem) {
		if (item.type === 'file') {
			previewFile = item;
			showPreview = true;
		} else {
			dispatch('itemClick', item);
		}
	}

	function handleRightClick(event: MouseEvent, item: FileSystemItem) {
		event.preventDefault();
		selectedItem = item;
		contextMenuPosition = { x: event.clientX, y: event.clientY };
		showContextMenu = true;
	}

	function shareFolder(folder: FileSystemItem) {
		if (folder.type === 'folder') {
			folderToShare = folder;
			showShareModal = true;
		}
	}

	function revokeShare(folder: FileSystemItem) {
		folderToRevoke = folder;
		showRevokeConfirm = true;
	}

	async function confirmRevokeShare() {
		if (!folderToRevoke || isRevoking) return;

		isRevoking = true;
		try {
			const response = await fetch(`/api/filesystem/folders/${folderToRevoke.id}/share`, {
				method: 'DELETE'
			});

			if (response.ok) {
				sharedFolders.delete(folderToRevoke.id);
				sharedFolders = new Set(sharedFolders);
				showRevokeConfirm = false;
				folderToRevoke = null;
			} else {
				alert('Failed to revoke share link');
			}
		} catch (error) {
			alert('Error revoking share link');
		}
		isRevoking = false;
	}

	function cancelRevokeShare() {
		showRevokeConfirm = false;
		folderToRevoke = null;
	}

	function handleShareModalClose() {
		showShareModal = false;
		folderToShare = null;
		checkSharedStatus();
	}

	async function downloadFile(item: FileSystemItem) {
		if (item.type === 'file') {
			try {
				const response = await fetch(`/api/files/download/${item.id}`);
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
				} else {
					alert('Error downloading file');
				}
			} catch (error) {
				alert('Download error: ' + error.message);
			}
		}
	}

	async function deleteItem(item: FileSystemItem) {
		if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
			try {
				const endpoint = item.type === 'file' ? 'files' : 'folders';
				const response = await fetch(`/api/filesystem/${endpoint}/${item.id}`, {
					method: 'DELETE'
				});

				if (response.ok) {
					deleteAttachment = item.id;
					dispatch('refresh');
				} else {
					alert('Error deleting item');
				}
			} catch (error) {
				alert('Delete error: ' + error.message);
			}
		}
	}

	async function renameItem(item: FileSystemItem) {
		const newName = prompt('New name:', item.name);
		if (newName && newName !== item.name) {
			try {
				const endpoint = item.type === 'file' ? 'files' : 'folders';
				const response = await fetch(`/api/filesystem/${endpoint}/${item.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ name: newName })
				});

				if (response.ok) {
					dispatch('refresh');
				} else {
					alert('Error renaming item');
				}
			} catch (error) {
				alert('Rename error: ' + error.message);
			}
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

	function previewFileFunction(item: FileSystemItem) {
		previewFile = item;
		showPreview = true;
	}

	function togglePieceExpansion(pieceId: number) {
		if (expandedPieces.has(pieceId)) {
			expandedPieces.delete(pieceId);
		} else {
			expandedPieces.add(pieceId);
		}
		expandedPieces = new Set(expandedPieces);
	}

	async function downloadMaterialFile(fileId: number, fileName: string) {
		try {
			const response = await fetch(`/api/files/download/${fileId}`);
			if (response.ok) {
				const blob = await response.blob();
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = fileName;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			} else {
				alert('Download error');
			}
		} catch (error) {
			alert('Download error');
		}
	}

	async function deleteMaterialFile(fileId: number, fileName: string) {
		if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
			return;
		}

		try {
			const response = await fetch(`/api/files/${fileId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				dispatch('refresh');
			} else {
				alert('Error deleting file');
			}
		} catch (error) {
			alert('Delete error: ' + error.message);
		}
	}

	function previewMaterialFile(file: any) {
		const fileItem: FileSystemItem = {
			id: file.id,
			name: file.name,
			type: 'file',
			path: file.path,
			size: file.size,
			mimeType: file.type,
			createdAt: new Date(file.createdAt),
			updatedAt: new Date(file.updatedAt)
		};

		previewFile = fileItem;
		showPreview = true;
	}

	if (browser) {
		checkMobile();
		window.addEventListener('resize', checkMobile);
	}
</script>

{#if items.length === 0}
	<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
		<div class="text-center py-{isMobile ? '8' : '12'}">
			<div
				class="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-[8px] mx-auto mb-4"
			>
				<Folder class="text-gray-400" size={isMobile ? 32 : 48} />
			</div>
			<h3 class="font-bold text-lg text-gray-700 mb-2">FOLDER IS EMPTY</h3>
			<p class="text-gray-500 {isMobile ? 'text-sm' : ''} mb-4">
				Upload files or create folders to get started
			</p>
			<div class="flex {isMobile ? 'flex-col gap-2' : 'justify-center gap-4'}">
				<button
					class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-blue-600 font-semibold flex items-center justify-center gap-2"
				>
					<Upload size={16} />
					Upload Files
				</button>
				<button
					class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold flex items-center justify-center gap-2"
				>
					<Plus size={16} />
					New Folder
				</button>
			</div>
		</div>
	</div>
{:else}
	<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
		<div class="flex items-center space-x-3 mb-6">
			<div class="flex items-center justify-center w-10 h-10 bg-[#6B9AD9] rounded-[8px]">
				<Folder class="w-5 h-5 text-white" />
			</div>
			<div>
				<h1 class="font-bold text-lg">FILES & FOLDERS ({items.length})</h1>
				<p class="text-sm text-gray-600">Click on items to navigate or preview</p>
			</div>
		</div>

		<div class="space-y-{isMobile ? '3' : '4'}">
			{#each items as item}
				{@const isExpanded = expandedPieces.has(item.pieceId)}
				{@const isShared = sharedFolders.has(item.id)}

				<div
					class="border-2 border-[#8C8C8C] rounded-[10px] overflow-hidden hover:bg-gray-50 transition-all duration-200 {isShared
						? 'ring-2 ring-purple-300'
						: ''}"
				>
					<div
						class="flex items-center justify-between p-{isMobile ? '3' : '4'} cursor-pointer group"
						on:click={() => handleItemClick(item)}
						on:contextmenu={(e) => handleRightClick(e, item)}
						role="button"
						tabindex="0"
					>
						<div class="flex items-center gap-{isMobile ? '3' : '4'} flex-1 min-w-0">
							<div
								class="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-[8px] border-2 border-gray-300 group-hover:border-[#6B9AD9] transition-colors flex items-center justify-center"
							>
								<svelte:component
									this={getFileIcon(item)}
									size={isMobile ? 20 : 24}
									class={getFileColor(item)}
								/>
							</div>

							<div class="flex-1 min-w-0 overflow-hidden">
								<div class="flex {isMobile ? 'flex-col' : 'items-center justify-between'} mb-2">
									<div class="flex items-center gap-2">
										<h3 class="font-bold text-gray-900 truncate" title={item.name}>{item.name}</h3>
										{#if isShared}
											<span
												class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded border border-purple-300 flex items-center gap-1"
											>
												<Share2 size={10} />
												Shared
											</span>
										{/if}
									</div>
									{#if !isMobile}
										<div class="flex items-center gap-2 text-xs">
											{#if item.type === 'file'}
												<span
													class="bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold border border-blue-300"
												>
													{formatFileSize(item.size || 0)}
												</span>
											{:else}
												<span
													class="bg-green-100 text-green-800 px-2 py-1 rounded font-semibold border border-green-300"
												>
													FOLDER
												</span>
											{/if}
										</div>
									{/if}
								</div>

								<div
									class="grid grid-cols-1 {isMobile
										? 'gap-1'
										: 'md:grid-cols-3 gap-4'} text-sm overflow-hidden"
								>
									<div class="min-w-0">
										<span class="font-medium text-gray-700">Type:</span>
										<span class="text-gray-600 {isMobile ? 'ml-2' : 'block'} break-words">
											{#if item.type === 'file'}
												{item.name.split('.').pop()?.toUpperCase() || 'FILE'}
											{:else}
												Folder
											{/if}
										</span>
									</div>
									<div class="min-w-0">
										<span class="font-medium text-gray-700">Modified:</span>
										<span class="text-gray-600 {isMobile ? 'ml-2' : 'block'}"
											>{formatDate(item.updatedAt)}</span
										>
									</div>
									<div class="min-w-0">
										{#if isShared}
											<span class="font-medium text-purple-700">Status:</span>
											<span class="text-purple-600 {isMobile ? 'ml-2' : 'block'} text-xs"
												>Publicly shared</span
											>
										{/if}
									</div>
								</div>
							</div>
						</div>

						<!-- MOBILE-VISIBLE Actions -->
						{#if showActions}
							<div class="flex items-center gap-2 flex-shrink-0">
								{#if item.type === 'file'}
									<button
										class="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-300 transition-colors"
										on:click|stopPropagation={() => previewFileFunction(item)}
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

									<button
										class="p-2 text-gray-600 hover:text-yellow-600 rounded-lg hover:bg-yellow-50 border border-transparent hover:border-yellow-300 transition-colors"
										on:click|stopPropagation={() => renameItem(item)}
										title="Rename"
									>
										<Edit3 size={16} />
									</button>

									<button
										class="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-300 transition-colors"
										on:click|stopPropagation={() => deleteItem(item)}
										title="Delete"
									>
										<Trash2 size={16} />
									</button>
								{:else}
									{#if isShared}
										<button
											class="p-2 text-purple-600 hover:text-red-600 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-300 transition-colors"
											on:click|stopPropagation={() => revokeShare(item)}
											title="Revoke share"
										>
											<ShieldOff size={16} />
										</button>
									{:else}
										<button
											class="p-2 text-gray-600 hover:text-purple-600 rounded-lg hover:bg-purple-50 border border-transparent hover:border-purple-300 transition-colors"
											on:click|stopPropagation={() => shareFolder(item)}
											title="Share folder"
										>
											<Share2 size={16} />
										</button>
									{/if}

									<button
										class="p-2 text-gray-600 hover:text-yellow-600 rounded-lg hover:bg-yellow-50 border border-transparent hover:border-yellow-300 transition-colors"
										on:click|stopPropagation={() => renameItem(item)}
										title="Rename"
									>
										<Edit3 size={16} />
									</button>

									<button
										class="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-300 transition-colors"
										on:click|stopPropagation={() => deleteItem(item)}
										title="Delete"
									>
										<Trash2 size={16} />
									</button>
								{/if}
							</div>
						{/if}
					</div>

					{#if showMaterials && item.type === 'folder' && item.pieceId}
						<div
							class="border-t-2 border-gray-300 bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden"
						>
							<div class="p-{isMobile ? '3' : '4'}">
								<div
									class="flex {isMobile ? 'flex-col' : 'items-center justify-between'} mb-4 gap-3"
								>
									<h4
										class="text-{isMobile
											? 'sm'
											: 'base'} font-bold text-gray-700 flex items-center gap-2"
									>
										<Package size={isMobile ? 14 : 16} class="text-blue-600" />
										SELECTED MATERIAL FOR THIS PIECE
									</h4>

									<button
										class="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:border-[#6B9AD9] hover:text-[#6B9AD9] transition-colors font-semibold text-{isMobile
											? 'sm'
											: 'base'} {isMobile ? 'w-full justify-center' : ''}"
										on:click={() => togglePieceExpansion(item.pieceId)}
									>
										{#if isExpanded}
											<ChevronDown size={16} />
											<span>Hide Details</span>
										{:else}
											<ChevronRight size={16} />
											<span>Show Details</span>
										{/if}
									</button>
								</div>

								{#if isExpanded}
									{#await loadMaterialForPiece(item.pieceId)}
										<div class="p-6 text-center">
											<div
												class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"
											></div>
											<p class="text-sm text-gray-600">Loading material...</p>
										</div>
									{:then { material, files }}
										{#if material}
											<div
												class="bg-white border-2 border-blue-300 rounded-[8px] p-{isMobile
													? '3'
													: '4'} mb-4 overflow-hidden"
											>
												<div class="flex items-center justify-between">
													<div class="flex-1 min-w-0">
														<h5
															class="font-bold text-gray-800 {isMobile ? 'text-sm' : ''} truncate"
															title={material.name}
														>
															{material.name}
														</h5>
														<div
															class="flex {isMobile
																? 'flex-col gap-1'
																: 'items-center gap-4'} mt-2 text-xs text-gray-500"
														>
															<span
																class="font-bold {files.length > 0
																	? 'text-green-600'
																	: 'text-orange-600'} flex items-center gap-1"
															>
																{files.length} file{files.length !== 1 ? 's' : ''}
																{#if files.length > 0}
																	<span class="text-green-500">✓</span>
																{:else}
																	<span class="text-orange-500">⚠</span>
																{/if}
															</span>
															{#if material.edition && !isMobile}
																<span class="break-words">Edition: {material.edition}</span>
															{/if}
															{#if material.editor && !isMobile}
																<span class="break-words">Publisher: {material.editor}</span>
															{/if}
														</div>
													</div>
												</div>

												{#if material.description && !isMobile}
													<div
														class="mt-3 p-2 bg-blue-50 rounded text-sm border border-blue-200 overflow-hidden"
													>
														<span class="font-medium text-blue-800">Description:</span>
														<span class="text-blue-700 break-words">{material.description}</span>
													</div>
												{/if}
											</div>

											{#if files.length > 0}
												<div
													class="bg-blue-50 border-2 border-blue-200 rounded-[8px] p-{isMobile
														? '3'
														: '4'} overflow-hidden"
												>
													<h5
														class="text-{isMobile
															? 'xs'
															: 'sm'} font-bold text-gray-700 mb-3 flex items-center gap-2"
													>
														<FileText size={14} class="text-blue-600" />
														AVAILABLE FILES ({files.length})
													</h5>
													<div class="space-y-{isMobile ? '2' : '3'} overflow-hidden">
														{#each files as file}
															<div
																class="flex items-center justify-between p-{isMobile
																	? '2'
																	: '3'} bg-white border-2 border-gray-300 rounded-[8px] hover:border-blue-400 transition-colors group min-w-0"
															>
																<div
																	class="flex items-center gap-{isMobile
																		? '2'
																		: '3'} flex-1 min-w-0"
																>
																	<div
																		class="w-8 h-8 bg-gray-100 rounded-[6px] border border-gray-300 flex items-center justify-center flex-shrink-0"
																	>
																		<svelte:component
																			this={getFileIcon({ ...file, type: 'file' })}
																			size={isMobile ? 14 : 16}
																			class={getFileColor({ ...file, type: 'file' })}
																		/>
																	</div>
																	<div class="flex-1 min-w-0">
																		<span
																			class="text-{isMobile
																				? 'xs'
																				: 'sm'} font-bold text-gray-700 truncate block"
																			title={file.name}>{file.name}</span
																		>
																		<span class="text-xs text-gray-500"
																			>{formatFileSize(file.size || 0)}</span
																		>
																	</div>
																</div>

																<!-- MOBILE-VISIBLE material file actions -->
																<div class="flex items-center gap-1 flex-shrink-0">
																	<button
																		class="p-{isMobile
																			? '1.5'
																			: '2'} text-gray-600 hover:text-blue-600 rounded-[6px] hover:bg-blue-50 border border-transparent hover:border-blue-300 transition-colors"
																		on:click={() => previewMaterialFile(file)}
																		title="Preview"
																	>
																		<Eye size={isMobile ? 12 : 14} />
																	</button>
																	<button
																		class="p-{isMobile
																			? '1.5'
																			: '2'} text-gray-600 hover:text-green-600 rounded-[6px] hover:bg-green-50 border border-transparent hover:border-green-300 transition-colors"
																		on:click={() => downloadMaterialFile(file.id, file.name)}
																		title="Download"
																	>
																		<Download size={isMobile ? 12 : 14} />
																	</button>
																	<button
																		class="p-{isMobile
																			? '1.5'
																			: '2'} text-gray-600 hover:text-red-600 rounded-[6px] hover:bg-red-50 border border-transparent hover:border-red-300 transition-colors"
																		on:click={() => deleteMaterialFile(file.id, file.name)}
																		title="Delete"
																	>
																		<X size={isMobile ? 12 : 14} />
																	</button>
																</div>
															</div>
														{/each}
													</div>
												</div>
											{:else}
												<div
													class="p-6 text-center text-gray-500 bg-gray-50 border-2 border-gray-300 rounded-[8px]"
												>
													<FileText class="mx-auto mb-2" size={isMobile ? 24 : 32} />
													<p class="text-{isMobile ? 'xs' : 'sm'} font-bold">
														NO FILES IN THIS MATERIAL
													</p>
													<p class="text-xs text-gray-400 mt-1">
														Add files from material management
													</p>
												</div>
											{/if}
										{:else}
											<div
												class="p-{isMobile
													? '4'
													: '6'} text-center text-gray-500 bg-gray-50 border-2 border-dashed border-gray-400 rounded-[8px] overflow-hidden"
											>
												<Package class="mx-auto mb-3 text-gray-400" size={isMobile ? 24 : 32} />
												<p class="text-{isMobile ? 'xs' : 'sm'} font-bold">NO MATERIAL SELECTED</p>
												<p class="text-xs text-gray-400 mt-1 break-words">
													Go to material management to select a material for this piece
												</p>
											</div>
										{/if}
									{:catch error}
										<div
											class="p-6 text-center text-red-500 bg-red-50 border-2 border-red-300 rounded-[8px]"
										>
											<p class="text-sm font-bold">Error loading material</p>
											<p class="text-xs mt-1">{error.message}</p>
										</div>
									{/await}
								{:else}
									<div
										class="bg-gray-50 border-2 border-gray-300 rounded-[8px] p-{isMobile
											? '4'
											: '6'} text-center"
									>
										<div
											class="flex {isMobile ? 'flex-col' : 'items-center'} gap-{isMobile
												? '3'
												: '4'}"
										>
											<div class="flex items-center gap-2 text-gray-600">
												<Package size={18} class="text-gray-500" />
												<span class="text-sm font-medium">Material information available</span>
											</div>
											{#if !isMobile}
												<div class="text-gray-400">•</div>
											{/if}
											<button
												class="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:border-[#6B9AD9] hover:text-[#6B9AD9] transition-colors font-semibold text-sm {isMobile
													? 'w-full justify-center'
													: ''}"
												on:click={() => togglePieceExpansion(item.pieceId)}
											>
												<ChevronRight size={14} />
												<span>Show Details</span>
											</button>
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

<!-- Context menu -->
{#if showContextMenu && selectedItem}
	<div
		class="fixed bg-white border-2 border-[#8C8C8C] rounded-[8px] shadow-lg py-2 z-50 min-w-[150px]"
		style="left: {contextMenuPosition.x}px; top: {contextMenuPosition.y}px;"
		on:click|stopPropagation
	>
		{#if selectedItem.type === 'file'}
			<button
				class="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700 font-semibold"
				on:click={() => {
					previewFileFunction(selectedItem);
					showContextMenu = false;
				}}
			>
				<Eye size={16} />
				Preview
			</button>

			<button
				class="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700 font-semibold"
				on:click={() => {
					downloadFile(selectedItem);
					showContextMenu = false;
				}}
			>
				<Download size={16} />
				Download
			</button>
		{:else}
			{@const isSharedItem = sharedFolders.has(selectedItem.id)}
			{#if isSharedItem}
				<button
					class="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-red-600 font-semibold"
					on:click={() => {
						revokeShare(selectedItem);
						showContextMenu = false;
					}}
				>
					<ShieldOff size={16} />
					Revoke Share
				</button>
			{:else}
				<button
					class="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-purple-600 font-semibold"
					on:click={() => {
						shareFolder(selectedItem);
						showContextMenu = false;
					}}
				>
					<Share2 size={16} />
					Share Folder
				</button>
			{/if}
		{/if}

		<button
			class="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700 font-semibold"
			on:click={() => {
				renameItem(selectedItem);
				showContextMenu = false;
			}}
		>
			<Edit3 size={16} />
			Rename
		</button>

		<hr class="my-1 border-gray-300" />

		<button
			class="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 flex items-center gap-2 font-semibold"
			on:click={() => {
				deleteItem(selectedItem);
				showContextMenu = false;
			}}
		>
			<Trash2 size={16} />
			Delete
		</button>
	</div>
{/if}

{#if showPreview && previewFile}
	<FilePreview
		fileId={previewFile.id}
		fileName={previewFile.name}
		fileType={previewFile.mimeType || ''}
		onClose={() => {
			showPreview = false;
			previewFile = null;
		}}
	/>
{/if}

{#if showShareModal && folderToShare}
	<ShareFolderModal
		folder={folderToShare}
		isVisible={showShareModal}
		on:close={handleShareModalClose}
	/>
{/if}

<!-- Revoke Confirmation Modal -->
{#if showRevokeConfirm && folderToRevoke}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-[10px] shadow-2xl max-w-md w-full">
			<!-- Header -->
			<div
				class="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50"
			>
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-red-500 rounded-[8px] flex items-center justify-center">
						<ShieldOff size={20} class="text-white" />
					</div>
					<div>
						<h1 class="font-bold text-lg text-gray-800">REVOKE SHARE LINK</h1>
						<p class="text-sm text-gray-600">This action cannot be undone</p>
					</div>
				</div>
			</div>

			<!-- Content -->
			<div class="p-6">
				<div class="bg-red-50 border-2 border-red-200 rounded-[8px] p-4 mb-6">
					<div class="flex items-start gap-3">
						<div
							class="w-8 h-8 bg-red-100 rounded-[6px] flex items-center justify-center flex-shrink-0 mt-0.5"
						>
							<AlertTriangle class="text-red-600" size={16} />
						</div>
						<div>
							<h4 class="font-bold text-red-800 mb-2">
								Are you sure you want to revoke the share link for "{folderToRevoke.name}"?
							</h4>
							<p class="text-sm text-red-700 mb-3">
								This will immediately block access for anyone who has the link. Users trying to
								access this shared folder will see a "Link Revoked" message.
							</p>
							<p class="text-sm text-red-600 font-medium">
								They will need to contact administrators for access.
							</p>
						</div>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex {isMobile ? 'flex-col gap-3' : 'gap-3'}">
					<button
						class="flex-1 px-4 py-3 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 border-2 border-gray-300 hover:border-gray-400 transition-colors font-semibold {isMobile
							? 'w-full justify-center'
							: ''}"
						on:click={cancelRevokeShare}
						disabled={isRevoking}
					>
						Cancel
					</button>
					<button
						class="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2 border-2 border-red-600 {isMobile
							? 'w-full'
							: ''}"
						on:click={confirmRevokeShare}
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

<svelte:window on:click={() => (showContextMenu = false)} />

<style>
	@media (max-width: 768px) {
		:global(.md\:grid-cols-3) {
			grid-template-columns: repeat(1, minmax(0, 1fr));
		}

		:global(.space-y-4) > :not([hidden]) ~ :not([hidden]) {
			margin-top: 0.75rem;
		}

		:global(.space-y-3) > :not([hidden]) ~ :not([hidden]) {
			margin-top: 0.5rem;
		}

		:global(.gap-4) {
			gap: 0.5rem;
		}

		:global(.gap-3) {
			gap: 0.375rem;
		}

		button {
			min-height: 44px;
		}

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

	.break-words {
		word-wrap: break-word;
		word-break: break-word;
		overflow-wrap: break-word;
	}
</style>
