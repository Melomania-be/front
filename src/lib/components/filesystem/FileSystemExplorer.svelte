<!-- src/lib/components/filesystem/FileSystemExplorer.svelte - Fixed version with correct API routes -->
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
		X
	} from 'lucide-svelte';
	import type { FileSystemItem } from '$lib/types/FileSystem';
	import type { Material } from '$lib/types/Material';
	import FilePreview from './FilePreview.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	const dispatch = createEventDispatcher();

	export let items: FileSystemItem[] = [];
	export let showActions = true;
	export let showMaterials = true;
	export let projectId: number | null = null;

	let selectedItem: FileSystemItem | null = null;
	let showContextMenu = false;
	let contextMenuPosition = { x: 0, y: 0 };
	let showPreview = false;
	let previewFile: FileSystemItem | null = null;
	let expandedPieces = new Set<number>();
	let selectedMaterialFiles: { [pieceId: number]: any[] } = {};
	let selectedMaterialInfo: { [pieceId: number]: any } = {};
	let isLoadingMaterials = false;
	let isMobile = false;
	let windowWidth = 0;

	// Responsive detection
	const checkMobile = () => {
		if (browser) {
			windowWidth = window.innerWidth;
			isMobile = window.innerWidth <= 768;
		}
	};

	onMount(async () => {
		checkMobile();
		if (browser) {
			window.addEventListener('resize', checkMobile);
		}

		await loadSelectedMaterialsInfo();

		// Listen for material selection changes
		const handleMaterialChange = (event) => {
			console.log('🔄 Material selection changed, reloading...');
			loadSelectedMaterialsInfo();
		};

		window.addEventListener('materialSelectionChanged', handleMaterialChange);

		return () => {
			if (browser) {
				window.removeEventListener('resize', checkMobile);
			}
			window.removeEventListener('materialSelectionChanged', handleMaterialChange);
		};
	});

	// Load information about selected materials (READ-ONLY)
	async function loadSelectedMaterialsInfo() {
		if (!items || items.length === 0) return;

		isLoadingMaterials = true;
		console.log('🔄 Loading selected materials info for', items.length, 'items');

		try {
			for (const item of items) {
				if (item.type === 'folder' && item.pieceId) {
					console.log(`🔍 Checking material for piece ${item.pieceId} (${item.name})`);

					// 1. Get selected material for this piece
					const selectedResponse = await fetch(`/api/pieces/${item.pieceId}/select-material`);

					if (selectedResponse.ok) {
						const selectedResult = await selectedResponse.json();
						console.log(`📋 Selected material result for piece ${item.pieceId}:`, selectedResult);

						if (selectedResult.materialId) {
							// 2. Get selected material info
							const materialResponse = await fetch(`/api/materials/${selectedResult.materialId}`);

							if (materialResponse.ok) {
								const materialData = await materialResponse.json();
								selectedMaterialInfo[item.pieceId] = materialData;
								console.log(`✅ Material info loaded for piece ${item.pieceId}:`, materialData.name);

								// 3. Get selected material files
								const filesResponse = await fetch(`/api/materials/${selectedResult.materialId}/files`);

								if (filesResponse.ok) {
									const files = await filesResponse.json();
									selectedMaterialFiles[item.pieceId] = Array.isArray(files) ? files : [];
									console.log(`📂 Files loaded for piece ${item.pieceId}:`, selectedMaterialFiles[item.pieceId].length);
								} else {
									selectedMaterialFiles[item.pieceId] = [];
								}
							}
						} else {
							console.log(`❌ No material selected for piece ${item.pieceId}`);
							selectedMaterialInfo[item.pieceId] = null;
							selectedMaterialFiles[item.pieceId] = [];
						}
					} else {
						console.log(`❌ Error getting selected material for piece ${item.pieceId}`);
						selectedMaterialInfo[item.pieceId] = null;
						selectedMaterialFiles[item.pieceId] = [];
					}
				}
			}

			// Force reactivity
			selectedMaterialInfo = { ...selectedMaterialInfo };
			selectedMaterialFiles = { ...selectedMaterialFiles };
			console.log('🔄 Final selected materials state:', selectedMaterialInfo);
		} catch (error) {
			console.error('❌ Error loading selected materials:', error);
		}

		isLoadingMaterials = false;
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
					console.error('Download failed:', response.status);
					alert('Error downloading file');
				}
			} catch (error) {
				console.error('Error downloading file:', error);
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
					dispatch('refresh');
				} else {
					console.error('Delete failed:', response.status);
					alert('Error deleting item');
				}
			} catch (error) {
				console.error('Error deleting item:', error);
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
					console.error('Rename failed:', response.status);
					alert('Error renaming item');
				}
			} catch (error) {
				console.error('Error renaming item:', error);
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
			console.log('📥 Downloading file:', fileId, fileName);
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
				console.log('✅ Download completed');
			} else {
				console.error('❌ Download failed:', response.status);
				alert('Download error');
			}
		} catch (error) {
			console.error('❌ Error downloading material file:', error);
			alert('Download error');
		}
	}

	// ✅ FIXED: Use correct API route for file deletion
	async function deleteMaterialFile(fileId: number, fileName: string) {
		if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
			return;
		}

		try {
			console.log('🗑️ Deleting file:', fileId, fileName);
			// Use the correct route that exists in your API
			const response = await fetch(`/api/files/${fileId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				console.log('✅ File deleted successfully');
				// Reload material files
				await loadSelectedMaterialsInfo();
				dispatch('refresh');
			} else {
				console.error('❌ Delete failed:', response.status);
				alert('Error deleting file');
			}
		} catch (error) {
			console.error('❌ Error deleting file:', error);
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

	// Get selected material for a piece
	function getSelectedMaterial(pieceId: number): any | null {
		const material = selectedMaterialInfo[pieceId] || null;
		console.log(`🔍 Getting selected material for piece ${pieceId}:`, material?.name || 'None');
		return material;
	}

	// Get selected material files
	function getSelectedMaterialFiles(pieceId: number): any[] {
		const files = selectedMaterialFiles[pieceId] || [];
		console.log(`📂 Getting files for piece ${pieceId}:`, files.length);
		return files;
	}
</script>

<div class="space-y-2 {isMobile ? 'px-1' : ''}">
	{#if items.length === 0}
		<div class="text-center py-{isMobile ? '8' : '12'}">
			<Folder class="mx-auto mb-4 text-gray-400" size={isMobile ? 32 : 48} />
			<p class="text-gray-500 {isMobile ? 'text-sm' : ''}">This folder is empty</p>
			<p class="text-{isMobile ? 'xs' : 'sm'} text-gray-400 mt-2">Upload files or create folders to get started</p>
		</div>
	{:else}
		<div class="grid gap-{isMobile ? '1' : '2'}">
			{#each items as item}
				{@const selectedMaterial = getSelectedMaterial(item.pieceId)}
				{@const selectedFiles = getSelectedMaterialFiles(item.pieceId)}
				{@const isExpanded = expandedPieces.has(item.pieceId)}

				<div class="bg-gray-50 rounded-lg border border-gray-200 hover:border-[#6B9AD9] transition-all duration-200">
					<!-- Main item -->
					<div
						class="flex items-center justify-between p-{isMobile ? '3' : '4'} hover:bg-gray-100 transition-all duration-200 cursor-pointer group"
						on:click={() => handleItemClick(item)}
						on:contextmenu={(e) => handleRightClick(e, item)}
					>
						<div class="flex items-center gap-{isMobile ? '2' : '3'} flex-1 min-w-0">
							<div class="flex-shrink-0 p-{isMobile ? '1.5' : '2'} bg-white rounded-lg border border-gray-200 group-hover:border-[#6B9AD9] transition-colors">
								<svelte:component this={getFileIcon(item)} size={isMobile ? 16 : 20} class={getFileColor(item)} />
							</div>
							<div class="flex-1 min-w-0">
								<h4 class="font-medium text-gray-800 truncate {isMobile ? 'text-sm' : ''}">{item.name}</h4>
								<div class="flex {isMobile ? 'flex-col' : 'items-center gap-4'} mt-1">
									<p class="text-{isMobile ? 'xs' : 'sm'} text-gray-500">
										{#if item.type === 'file'}
											{formatFileSize(item.size || 0)}
										{:else}
											Folder
											{#if selectedMaterial}
												{#if !isMobile}• Material: {selectedMaterial.name}{/if}
												• {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
											{:else}
												• No material selected
											{/if}
										{/if}
									</p>
									{#if !isMobile}
										<p class="text-sm text-gray-500">
											{formatDate(item.updatedAt)}
										</p>
									{/if}
								</div>
							</div>
						</div>

						{#if showActions && !isMobile}
							<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
								{#if item.type === 'file'}
									<button
										class="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
										on:click|stopPropagation={() => previewFileFunction(item)}
										title="Preview"
									>
										<Eye size={16} />
									</button>

									<button
										class="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
										on:click|stopPropagation={() => downloadFile(item)}
										title="Download"
									>
										<Download size={16} />
									</button>
								{/if}

								<button
									class="p-2 text-gray-600 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
									on:click|stopPropagation={() => renameItem(item)}
									title="Rename"
								>
									<Edit3 size={16} />
								</button>

								<button
									class="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
									on:click|stopPropagation={() => deleteItem(item)}
									title="Delete"
								>
									<Trash2 size={16} />
								</button>
							</div>
						{/if}
					</div>

					<!-- SELECTED MATERIAL DISPLAY SECTION -->
					{#if showMaterials && item.type === 'folder' && item.pieceId}
						<div class="border-t border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
							<div class="p-{isMobile ? '2' : '3'}">
								<div class="flex {isMobile ? 'flex-col' : 'items-center justify-between'} mb-3 gap-2">
									<h5 class="text-{isMobile ? 'xs' : 'sm'} font-semibold text-gray-700 flex items-center gap-2">
										<Package size={isMobile ? 12 : 14} class="text-blue-600" />
										Selected Material for this Piece
									</h5>

									{#if selectedMaterial}
										<div class="flex items-center gap-2">
											<span class="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
												✓ {selectedMaterial.name}
											</span>
											<button
												class="text-xs text-blue-600 hover:text-blue-800"
												on:click={() => togglePieceExpansion(item.pieceId)}
											>
												{#if isExpanded}
													<ChevronDown size={isMobile ? 12 : 16} />
												{:else}
													<ChevronRight size={isMobile ? 12 : 16} />
												{/if}
											</button>
										</div>
									{:else}
										<div class="flex items-center gap-2">
											<span class="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
												⚠ No material selected
											</span>
											<Info size={isMobile ? 12 : 14} class="text-gray-400" />
										</div>
									{/if}
								</div>

								{#if selectedMaterial}
									<!-- Selected material information -->
									<div class="bg-white border border-blue-200 rounded-lg p-{isMobile ? '2' : '3'} mb-3">
										<div class="flex items-center justify-between">
											<div class="flex-1">
												<h6 class="font-medium text-gray-800 {isMobile ? 'text-sm' : ''}">{selectedMaterial.name}</h6>
												<div class="flex {isMobile ? 'flex-col' : 'items-center gap-4'} mt-1 text-xs text-gray-500">
													<span class="font-semibold {selectedFiles.length > 0 ? 'text-green-600' : 'text-orange-600'}">
														{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
														{#if selectedFiles.length > 0}
															✓
														{:else}
															⚠
														{/if}
													</span>
													{#if selectedMaterial.edition && !isMobile}
														<span>Edition: {selectedMaterial.edition}</span>
													{/if}
													{#if selectedMaterial.editor && !isMobile}
														<span>Publisher: {selectedMaterial.editor}</span>
													{/if}
												</div>
											</div>
										</div>

										{#if selectedMaterial.description && !isMobile}
											<p class="text-sm text-gray-600 mt-2">{selectedMaterial.description}</p>
										{/if}
									</div>

									<!-- Selected material files with enhanced actions -->
									{#if isExpanded && selectedFiles.length > 0}
										<div class="bg-blue-25 border border-blue-100 rounded-lg p-{isMobile ? '2' : '3'}">
											<h6 class="text-{isMobile ? 'xs' : 'sm'} font-medium text-gray-700 mb-2">
												Available Files ({selectedFiles.length})
											</h6>
											<div class="space-y-{isMobile ? '1' : '2'}">
												{#each selectedFiles as file}
													<div class="flex items-center justify-between p-{isMobile ? '2' : '3'} bg-white border border-gray-200 rounded hover:border-blue-300 transition-colors group">
														<div class="flex items-center gap-{isMobile ? '2' : '3'} flex-1 min-w-0">
															<svelte:component
																this={getFileIcon({...file, type: 'file'})}
																size={isMobile ? 12 : 16}
																class={getFileColor({...file, type: 'file'})}
															/>
															<div class="flex-1 min-w-0">
																<span class="text-{isMobile ? 'xs' : 'sm'} font-medium text-gray-700 truncate block">{file.name}</span>
																<span class="text-xs text-gray-500">{formatFileSize(file.size || 0)}</span>
															</div>
														</div>

														<div class="flex items-center gap-1 {isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity">
															<button
																class="p-{isMobile ? '1' : '1.5'} text-gray-600 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
																on:click={() => previewMaterialFile(file)}
																title="Preview"
															>
																<Eye size={isMobile ? 12 : 14} />
															</button>
															<button
																class="p-{isMobile ? '1' : '1.5'} text-gray-600 hover:text-green-600 rounded hover:bg-green-50 transition-colors"
																on:click={() => downloadMaterialFile(file.id, file.name)}
																title="Download"
															>
																<Download size={isMobile ? 12 : 14} />
															</button>
															<button
																class="p-{isMobile ? '1' : '1.5'} text-gray-600 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
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
									{:else if isExpanded && selectedFiles.length === 0}
										<div class="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
											<FileText class="mx-auto mb-2" size={isMobile ? 20 : 24} />
											<p class="text-{isMobile ? 'xs' : 'sm'}">No files in this material</p>
											<p class="text-xs text-gray-400 mt-1">
												Add files from material management
											</p>
										</div>
									{/if}
								{:else}
									<!-- Message when no material is selected -->
									<div class="p-{isMobile ? '3' : '4'} text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
										<Package class="mx-auto mb-2 text-gray-400" size={isMobile ? 20 : 24} />
										<p class="text-{isMobile ? 'xs' : 'sm'} font-medium">No Material Selected</p>
										<p class="text-xs text-gray-400 mt-1">
											Go to material management to select a material for this piece
										</p>
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Context menu -->
{#if showContextMenu && selectedItem}
	<div
		class="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-[150px]"
		style="left: {contextMenuPosition.x}px; top: {contextMenuPosition.y}px;"
		on:click|stopPropagation
	>
		{#if selectedItem.type === 'file'}
			<button
				class="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700"
				on:click={() => {
					previewFileFunction(selectedItem);
					showContextMenu = false;
				}}
			>
				<Eye size={16} />
				Preview
			</button>

			<button
				class="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700"
				on:click={() => {
					downloadFile(selectedItem);
					showContextMenu = false;
				}}
			>
				<Download size={16} />
				Download
			</button>
		{/if}

		<button
			class="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700"
			on:click={() => {
				renameItem(selectedItem);
				showContextMenu = false;
			}}
		>
			<Edit3 size={16} />
			Rename
		</button>

		<hr class="my-1 border-gray-200" />

		<button
			class="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 flex items-center gap-2"
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

<!-- Preview modal -->
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

<svelte:window on:click={() => showContextMenu = false} />

<style>
    .bg-blue-25 {
        background-color: #f8faff;
    }

    @media (max-width: 768px) {
        :global(.space-y-4) > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0.5rem;
        }

        :global(.space-y-2) > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0.25rem;
        }

        :global(.gap-4) {
            gap: 0.5rem;
        }

        :global(.gap-3) {
            gap: 0.375rem;
        }

        :global(.gap-2) {
            gap: 0.25rem;
        }
    }
</style>