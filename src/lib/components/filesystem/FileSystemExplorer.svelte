<!-- src/lib/components/filesystem/FileSystemExplorer.svelte - Design uniforme avec auditions -->
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

	async function deleteMaterialFile(fileId: number, fileName: string) {
		if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
			return;
		}

		try {
			console.log('🗑️ Deleting file:', fileId, fileName);
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

{#if items.length === 0}
	<!-- Empty State - Design Uniforme -->
	<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
		<div class="text-center py-{isMobile ? '8' : '12'}">
			<div class="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-[8px] mx-auto mb-4">
				<Folder class="text-gray-400" size={isMobile ? 32 : 48} />
			</div>
			<h3 class="font-bold text-lg text-gray-700 mb-2">FOLDER IS EMPTY</h3>
			<p class="text-gray-500 {isMobile ? 'text-sm' : ''} mb-4">Upload files or create folders to get started</p>
			<div class="flex {isMobile ? 'flex-col gap-2' : 'justify-center gap-4'}">
				<button class="px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-blue-600 font-semibold flex items-center justify-center gap-2">
					<Upload size={16} />
					Upload Files
				</button>
				<button class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold flex items-center justify-center gap-2">
					<Plus size={16} />
					New Folder
				</button>
			</div>
		</div>
	</div>
{:else}
	<!-- Files List - Design Uniforme -->
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
				{@const selectedMaterial = getSelectedMaterial(item.pieceId)}
				{@const selectedFiles = getSelectedMaterialFiles(item.pieceId)}
				{@const isExpanded = expandedPieces.has(item.pieceId)}

				<div class="border-2 border-[#8C8C8C] rounded-[10px] overflow-hidden hover:bg-gray-50 transition-all duration-200">
					<!-- Main Item -->
					<div
						class="flex items-center justify-between p-{isMobile ? '3' : '4'} cursor-pointer group"
						on:click={() => handleItemClick(item)}
						on:contextmenu={(e) => handleRightClick(e, item)}
						role="button"
						tabindex="0"
					>
						<div class="flex items-center gap-{isMobile ? '3' : '4'} flex-1 min-w-0">
							<!-- Icon -->
							<div class="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-[8px] border-2 border-gray-300 group-hover:border-[#6B9AD9] transition-colors flex items-center justify-center">
								<svelte:component this={getFileIcon(item)} size={isMobile ? 20 : 24} class={getFileColor(item)} />
							</div>

							<!-- File Info -->
							<div class="flex-1 min-w-0 overflow-hidden">
								<div class="flex {isMobile ? 'flex-col' : 'items-center justify-between'} mb-2">
									<h3 class="font-bold text-gray-900 truncate" title={item.name}>{item.name}</h3>
									{#if !isMobile}
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
									{/if}
								</div>

								<!-- Details Grid -->
								<div class="grid grid-cols-1 {isMobile ? 'gap-1' : 'md:grid-cols-3 gap-4'} text-sm overflow-hidden">
									<div class="min-w-0">
										<span class="font-medium text-gray-700">Type:</span>
										<span class="text-gray-600 {isMobile ? 'ml-2' : 'block'} break-words">
											{#if item.type === 'file'}
												{item.name.split('.').pop()?.toUpperCase() || 'FILE'}
											{:else}
												Folder
												{#if selectedMaterial}
													• Material: {selectedMaterial.name}
												{:else if item.pieceId}
													• No material selected
												{/if}
											{/if}
										</span>
									</div>
									<div class="min-w-0">
										<span class="font-medium text-gray-700">Modified:</span>
										<span class="text-gray-600 {isMobile ? 'ml-2' : 'block'}">{formatDate(item.updatedAt)}</span>
									</div>
									{#if item.type === 'folder' && selectedFiles.length > 0}
										<div class="min-w-0">
											<span class="font-medium text-gray-700">Files:</span>
											<span class="text-green-600 font-semibold {isMobile ? 'ml-2' : 'block'}">
												{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} ✓
											</span>
										</div>
									{/if}
								</div>
							</div>
						</div>

						<!-- Actions -->
						{#if showActions && !isMobile}
							<div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
							</div>
						{/if}
					</div>

					<!-- SELECTED MATERIAL DISPLAY SECTION -->
					{#if showMaterials && item.type === 'folder' && item.pieceId}
						<div class="border-t-2 border-gray-300 bg-gradient-to-r from-blue-50 to-indigo-50 overflow-hidden">
							<div class="p-{isMobile ? '3' : '4'}">
								<div class="flex {isMobile ? 'flex-col' : 'items-center justify-between'} mb-4 gap-2">
									<h4 class="text-{isMobile ? 'sm' : 'base'} font-bold text-gray-700 flex items-center gap-2">
										<Package size={isMobile ? 14 : 16} class="text-blue-600" />
										SELECTED MATERIAL FOR THIS PIECE
									</h4>

									{#if selectedMaterial}
										<div class="flex items-center gap-2">
											<span class="text-xs text-green-600 bg-green-100 px-3 py-1 rounded-lg font-bold border border-green-300 break-words">
												✓ {selectedMaterial.name}
											</span>
											<button
												class="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 p-1"
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
											<span class="text-xs text-orange-600 bg-orange-100 px-3 py-1 rounded-lg font-bold border border-orange-300">
												⚠ NO MATERIAL SELECTED
											</span>
											<Info size={isMobile ? 12 : 14} class="text-gray-400" />
										</div>
									{/if}
								</div>

								{#if selectedMaterial}
									<!-- Selected material information -->
									<div class="bg-white border-2 border-blue-300 rounded-[8px] p-{isMobile ? '3' : '4'} mb-4 overflow-hidden">
										<div class="flex items-center justify-between">
											<div class="flex-1 min-w-0">
												<h5 class="font-bold text-gray-800 {isMobile ? 'text-sm' : ''} truncate" title={selectedMaterial.name}>{selectedMaterial.name}</h5>
												<div class="flex {isMobile ? 'flex-col gap-1' : 'items-center gap-4'} mt-2 text-xs text-gray-500">
													<span class="font-bold {selectedFiles.length > 0 ? 'text-green-600' : 'text-orange-600'} flex items-center gap-1">
														{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
														{#if selectedFiles.length > 0}
															<span class="text-green-500">✓</span>
														{:else}
															<span class="text-orange-500">⚠</span>
														{/if}
													</span>
													{#if selectedMaterial.edition && !isMobile}
														<span class="break-words">Edition: {selectedMaterial.edition}</span>
													{/if}
													{#if selectedMaterial.editor && !isMobile}
														<span class="break-words">Publisher: {selectedMaterial.editor}</span>
													{/if}
												</div>
											</div>
										</div>

										{#if selectedMaterial.description && !isMobile}
											<div class="mt-3 p-2 bg-blue-50 rounded text-sm border border-blue-200 overflow-hidden">
												<span class="font-medium text-blue-800">Description:</span>
												<span class="text-blue-700 break-words">{selectedMaterial.description}</span>
											</div>
										{/if}
									</div>

									<!-- Selected material files with enhanced actions -->
									{#if isExpanded && selectedFiles.length > 0}
										<div class="bg-blue-50 border-2 border-blue-200 rounded-[8px] p-{isMobile ? '3' : '4'} overflow-hidden">
											<h5 class="text-{isMobile ? 'xs' : 'sm'} font-bold text-gray-700 mb-3 flex items-center gap-2">
												<FileText size={14} class="text-blue-600" />
												AVAILABLE FILES ({selectedFiles.length})
											</h5>
											<div class="space-y-{isMobile ? '2' : '3'} overflow-hidden">
												{#each selectedFiles as file}
													<div class="flex items-center justify-between p-{isMobile ? '2' : '3'} bg-white border-2 border-gray-300 rounded-[8px] hover:border-blue-400 transition-colors group min-w-0">
														<div class="flex items-center gap-{isMobile ? '2' : '3'} flex-1 min-w-0">
															<div class="w-8 h-8 bg-gray-100 rounded-[6px] border border-gray-300 flex items-center justify-center flex-shrink-0">
																<svelte:component
																	this={getFileIcon({...file, type: 'file'})}
																	size={isMobile ? 14 : 16}
																	class={getFileColor({...file, type: 'file'})}
																/>
															</div>
															<div class="flex-1 min-w-0">
																<span class="text-{isMobile ? 'xs' : 'sm'} font-bold text-gray-700 truncate block" title={file.name}>{file.name}</span>
																<span class="text-xs text-gray-500">{formatFileSize(file.size || 0)}</span>
															</div>
														</div>

														<div class="flex items-center gap-1 {isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity flex-shrink-0">
															<!-- ✅ BOUTON PREVIEW -->
															<button
																class="p-{isMobile ? '1.5' : '2'} text-gray-600 hover:text-blue-600 rounded-[6px] hover:bg-blue-50 border border-transparent hover:border-blue-300 transition-colors"
																on:click={() => previewMaterialFile(file)}
																title="Preview"
															>
																<Eye size={isMobile ? 12 : 14} />
															</button>
															<button
																class="p-{isMobile ? '1.5' : '2'} text-gray-600 hover:text-green-600 rounded-[6px] hover:bg-green-50 border border-transparent hover:border-green-300 transition-colors"
																on:click={() => downloadMaterialFile(file.id, file.name)}
																title="Download"
															>
																<Download size={isMobile ? 12 : 14} />
															</button>
															<button
																class="p-{isMobile ? '1.5' : '2'} text-gray-600 hover:text-red-600 rounded-[6px] hover:bg-red-50 border border-transparent hover:border-red-300 transition-colors"
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
										<div class="p-6 text-center text-gray-500 bg-gray-50 border-2 border-gray-300 rounded-[8px]">
											<FileText class="mx-auto mb-2" size={isMobile ? 24 : 32} />
											<p class="text-{isMobile ? 'xs' : 'sm'} font-bold">NO FILES IN THIS MATERIAL</p>
											<p class="text-xs text-gray-400 mt-1">
												Add files from material management
											</p>
										</div>
									{/if}
								{:else}
									<!-- Message when no material is selected -->
									<div class="p-{isMobile ? '4' : '6'} text-center text-gray-500 bg-gray-50 border-2 border-dashed border-gray-400 rounded-[8px] overflow-hidden">
										<Package class="mx-auto mb-3 text-gray-400" size={isMobile ? 24 : 32} />
										<p class="text-{isMobile ? 'xs' : 'sm'} font-bold">NO MATERIAL SELECTED</p>
										<p class="text-xs text-gray-400 mt-1 break-words">
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
    /* Enhanced mobile responsiveness */
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

        /* Improve touch targets */
        button {
            min-height: 44px;
        }

        /* Force text wrapping and prevent overflow */
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

    /* Force text wrapping globally */
    .break-words {
        word-wrap: break-word;
        word-break: break-word;
        overflow-wrap: break-word;
    }
</style>