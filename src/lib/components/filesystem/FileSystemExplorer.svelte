<!-- src/lib/components/filesystem/FileSystemExplorer.svelte - Version finale propre -->
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
		Info
	} from 'lucide-svelte';
	import type { FileSystemItem } from '$lib/types/FileSystem';
	import type { Material } from '$lib/types/Material';
	import FilePreview from './FilePreview.svelte';
	import { onMount } from 'svelte';

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
	let materialsVersion = 0;

	onMount(async () => {
		await loadSelectedMaterialsInfo();

		const handleMaterialChange = () => {
			loadSelectedMaterialsInfo();
		};

		window.addEventListener('materialSelectionChanged', handleMaterialChange);

		return () => {
			window.removeEventListener('materialSelectionChanged', handleMaterialChange);
		};
	});

	async function loadSelectedMaterialsInfo() {
		if (!items || items.length === 0) return;

		isLoadingMaterials = true;

		try {
			for (const item of items) {
				if (item.type === 'folder' && item.pieceId) {
					try {
						const selectedResponse = await fetch(`/api/pieces/${item.pieceId}/select-material`);

						if (selectedResponse.ok) {
							const selectedResult = await selectedResponse.json();

							if (selectedResult.materialId) {
								const materialResponse = await fetch(`/api/materials/${selectedResult.materialId}`);

								if (materialResponse.ok) {
									const materialData = await materialResponse.json();
									selectedMaterialInfo[item.pieceId] = materialData;

									const filesResponse = await fetch(`/api/materials/${selectedResult.materialId}/files`);

									if (filesResponse.ok) {
										const files = await filesResponse.json();
										selectedMaterialFiles[item.pieceId] = Array.isArray(files) ? files : [];
									} else {
										selectedMaterialFiles[item.pieceId] = [];
									}
								}
							} else {
								selectedMaterialInfo[item.pieceId] = null;
								selectedMaterialFiles[item.pieceId] = [];
							}
						} else {
							selectedMaterialInfo[item.pieceId] = null;
							selectedMaterialFiles[item.pieceId] = [];
						}
					} catch (error) {
						selectedMaterialInfo[item.pieceId] = null;
						selectedMaterialFiles[item.pieceId] = [];
					}
				}
			}

			selectedMaterialInfo = { ...selectedMaterialInfo };
			selectedMaterialFiles = { ...selectedMaterialFiles };
			materialsVersion++;

		} catch (error) {
			// Ignore errors
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
				}
			} catch (error) {
				console.error('Error downloading file:', error);
			}
		}
	}

	async function deleteItem(item: FileSystemItem) {
		if (confirm(`Êtes-vous sûr de vouloir supprimer "${item.name}" ?`)) {
			try {
				const endpoint = item.type === 'file' ? 'files' : 'folders';
				const response = await fetch(`/api/filesystem/${endpoint}/${item.id}`, {
					method: 'DELETE'
				});

				if (response.ok) {
					dispatch('refresh');
				}
			} catch (error) {
				console.error('Error deleting item:', error);
			}
		}
	}

	async function renameItem(item: FileSystemItem) {
		const newName = prompt('Nouveau nom:', item.name);
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
				}
			} catch (error) {
				console.error('Error renaming item:', error);
			}
		}
	}

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString('fr-FR', {
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
			}
		} catch (error) {
			console.error('Error downloading material file:', error);
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

	function getSelectedMaterial(pieceId: number): any | null {
		return selectedMaterialInfo[pieceId] || null;
	}

	function getSelectedMaterialFiles(pieceId: number): any[] {
		return selectedMaterialFiles[pieceId] || [];
	}

	$: if (items && items.length > 0) {
		loadSelectedMaterialsInfo();
	}
</script>

<div class="space-y-2">
	{#if items.length === 0}
		<div class="text-center py-12">
			<Folder class="mx-auto mb-4 text-gray-400" size={48} />
			<p class="text-gray-500">Ce dossier est vide</p>
			<p class="text-sm text-gray-400 mt-2">Uploadez des fichiers ou créez des dossiers pour commencer</p>
		</div>
	{:else}
		<div class="grid gap-2">
			{#each items as item}
				{@const selectedMaterial = getSelectedMaterial(item.pieceId)}
				{@const selectedFiles = getSelectedMaterialFiles(item.pieceId)}
				{@const isExpanded = expandedPieces.has(item.pieceId)}

				{#key `${item.id}-${materialsVersion}`}
					<div class="bg-gray-50 rounded-lg border border-gray-200 hover:border-[#6B9AD9] transition-all duration-200">
						<div
							class="flex items-center justify-between p-4 hover:bg-gray-100 transition-all duration-200 cursor-pointer group"
							on:click={() => handleItemClick(item)}
							on:contextmenu={(e) => handleRightClick(e, item)}
						>
							<div class="flex items-center gap-3 flex-1 min-w-0">
								<div class="flex-shrink-0 p-2 bg-white rounded-lg border border-gray-200 group-hover:border-[#6B9AD9] transition-colors">
									<svelte:component this={getFileIcon(item)} size={20} class={getFileColor(item)} />
								</div>
								<div class="flex-1 min-w-0">
									<h4 class="font-medium text-gray-800 truncate">{item.name}</h4>
									<div class="flex items-center gap-4 mt-1">
										<p class="text-sm text-gray-500">
											{#if item.type === 'file'}
												{formatFileSize(item.size || 0)}
											{:else}
												Dossier
												{#if selectedMaterial}
													• Matériel: {selectedMaterial.name}
													• {selectedFiles.length} fichier{selectedFiles.length !== 1 ? 's' : ''}
												{:else}
													• Aucun matériel sélectionné
												{/if}
											{/if}
										</p>
										<p class="text-sm text-gray-500">
											{formatDate(item.updatedAt)}
										</p>
									</div>
								</div>
							</div>

							{#if showActions}
								<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
									{#if item.type === 'file'}
										<button
											class="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
											on:click|stopPropagation={() => previewFileFunction(item)}
											title="Prévisualiser"
										>
											<Eye size={16} />
										</button>

										<button
											class="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
											on:click|stopPropagation={() => downloadFile(item)}
											title="Télécharger"
										>
											<Download size={16} />
										</button>
									{/if}

									<button
										class="p-2 text-gray-600 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
										on:click|stopPropagation={() => renameItem(item)}
										title="Renommer"
									>
										<Edit3 size={16} />
									</button>

									<button
										class="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
										on:click|stopPropagation={() => deleteItem(item)}
										title="Supprimer"
									>
										<Trash2 size={16} />
									</button>
								</div>
							{/if}
						</div>

						{#if showMaterials && item.type === 'folder' && item.pieceId}
							<div class="border-t border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
								<div class="p-3">
									<div class="flex items-center justify-between mb-3">
										<h5 class="text-sm font-semibold text-gray-700 flex items-center gap-2">
											<Package size={14} class="text-blue-600" />
											Matériel sélectionné pour cette pièce
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
														<ChevronDown size={16} />
													{:else}
														<ChevronRight size={16} />
													{/if}
												</button>
											</div>
										{:else}
											<div class="flex items-center gap-2">
												<span class="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
													⚠ Aucun matériel sélectionné
												</span>
												<Info size={14} class="text-gray-400" />
											</div>
										{/if}
									</div>

									{#if selectedMaterial}
										<div class="bg-white border border-blue-200 rounded-lg p-3 mb-3">
											<div class="flex items-center justify-between">
												<div class="flex-1">
													<h6 class="font-medium text-gray-800">{selectedMaterial.name}</h6>
													<div class="flex items-center gap-4 mt-1 text-xs text-gray-500">
														<span class="font-semibold {selectedFiles.length > 0 ? 'text-green-600' : 'text-orange-600'}">
															{selectedFiles.length} fichier{selectedFiles.length !== 1 ? 's' : ''}
															{#if selectedFiles.length > 0}
																✓
															{:else}
																⚠
															{/if}
														</span>
														{#if selectedMaterial.edition}
															<span>Édition: {selectedMaterial.edition}</span>
														{/if}
														{#if selectedMaterial.editor}
															<span>Éditeur: {selectedMaterial.editor}</span>
														{/if}
													</div>
												</div>
											</div>

											{#if selectedMaterial.description}
												<p class="text-sm text-gray-600 mt-2">{selectedMaterial.description}</p>
											{/if}
										</div>

										{#if isExpanded && selectedFiles.length > 0}
											<div class="bg-blue-25 border border-blue-100 rounded-lg p-3">
												<h6 class="text-sm font-medium text-gray-700 mb-2">
													Fichiers disponibles ({selectedFiles.length})
												</h6>
												<div class="space-y-2">
													{#each selectedFiles as file}
														<div class="flex items-center justify-between p-2 bg-white border border-gray-200 rounded hover:border-blue-300 transition-colors group">
															<div class="flex items-center gap-2 flex-1 min-w-0">
																<svelte:component
																	this={getFileIcon({...file, type: 'file'})}
																	size={16}
																	class={getFileColor({...file, type: 'file'})}
																/>
																<span class="text-sm font-medium text-gray-700 truncate">{file.name}</span>
																<span class="text-xs text-gray-500">{formatFileSize(file.size || 0)}</span>
															</div>

															<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
																<button
																	class="p-1 text-gray-600 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
																	on:click={() => previewMaterialFile(file)}
																	title="Prévisualiser"
																>
																	<Eye size={14} />
																</button>
																<button
																	class="p-1 text-gray-600 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
																	on:click={() => downloadMaterialFile(file.id, file.name)}
																	title="Télécharger"
																>
																	<Download size={14} />
																</button>
															</div>
														</div>
													{/each}
												</div>
											</div>
										{:else if isExpanded && selectedFiles.length === 0}
											<div class="p-4 text-center text-gray-500 bg-gray-50 rounded-lg">
												<FileText class="mx-auto mb-2" size={24} />
												<p class="text-sm">Aucun fichier dans ce matériel</p>
												<p class="text-xs text-gray-400 mt-1">
													Ajoutez des fichiers depuis la gestion des matériels
												</p>
											</div>
										{/if}
									{:else}
										<div class="p-4 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
											<Package class="mx-auto mb-2 text-gray-400" size={24} />
											<p class="text-sm font-medium">Aucun matériel sélectionné</p>
											<p class="text-xs text-gray-400 mt-1">
												Rendez-vous dans la gestion des matériels pour sélectionner un matériel pour cette pièce
											</p>
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>
				{/key}
			{/each}
		</div>
	{/if}
</div>

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
				Prévisualiser
			</button>

			<button
				class="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-gray-700"
				on:click={() => {
					downloadFile(selectedItem);
					showContextMenu = false;
				}}
			>
				<Download size={16} />
				Télécharger
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
			Renommer
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
			Supprimer
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

<svelte:window on:click={() => showContextMenu = false} />

<style>
    .bg-blue-25 {
        background-color: #f8faff;
    }
</style>