<!-- src/lib/components/filesystem/FileSystemExplorer.svelte - Version corrigée avec gestion complète des matériels -->
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
		Plus
	} from 'lucide-svelte';
	import type { FileSystemItem } from '$lib/types/FileSystem';
	import type { Material } from '$lib/types/Material';
	import FilePreview from './FilePreview.svelte';

	import { onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	export let items: FileSystemItem[] = [];
	export let showActions = true;
	export let showMaterials = true; // Afficher les matériels dans les dossiers de pièces
	export let projectId: number | null = null; // Pour les actions spécifiques au projet

	let selectedItem: FileSystemItem | null = null;
	let showContextMenu = false;
	let contextMenuPosition = { x: 0, y: 0 };
	let showPreview = false;
	let previewFile: FileSystemItem | null = null;
	let expandedMaterials: Set<number> = new Set(); // Matériels expanded
	let showMaterialUploader: { [key: number]: boolean } = {}; // Upload par matériel
	let materialsData: { [key: number]: Material[] } = {}; // Cache des matériels avec fichiers
	let loadedPieces = new Set<number>(); // Track des pièces déjà chargées

	// ✅ CHARGEMENT AUTOMATIQUE AU MONTAGE
	onMount(async () => {
		// Charger les matériels pour toutes les pièces
		for (const item of items) {
			if (item.type === 'folder' && item.pieceId && !loadedPieces.has(item.pieceId)) {
				await loadMaterialsWithFiles(item.pieceId);
				loadedPieces.add(item.pieceId);
			}
		}
		materialsData = { ...materialsData }; // Force reactivity
	});

	// ✅ RÉACTIF AUX CHANGEMENTS D'ITEMS
	$: {
		if (items) {
			loadMaterialsForNewItems();
		}
	}

	async function loadMaterialsForNewItems() {
		for (const item of items) {
			if (item.type === 'folder' && item.pieceId && !loadedPieces.has(item.pieceId)) {
				await loadMaterialsWithFiles(item.pieceId);
				loadedPieces.add(item.pieceId);
			}
		}
		materialsData = { ...materialsData };
	}

	// ✅ CHARGEMENT DES MATÉRIELS AVEC FICHIERS (comme dans ProgramSection)
	async function loadMaterialsWithFiles(pieceId: number) {
		if (materialsData[pieceId]) return materialsData[pieceId]; // Cache

		try {
			console.log(`📦 Loading materials for piece: ${pieceId}`);

			const response = await fetch(`/api/materials/piece/${pieceId}`);
			if (response.ok) {
				const materials = await response.json();
				console.log(`📦 Loaded ${materials.length} materials for piece ${pieceId}:`, materials);

				// ✅ COPIE DE LA LOGIQUE DE ProgramSection.svelte
				// Charger les fichiers pour chaque matériel
				for (const material of materials) {
					console.log(`🔍 Material ${material.name} has files:`, material.files);
					console.log(`🔍 Material ${material.name} files_count:`, material.files_count);

					// S'assurer que les fichiers sont présents
					if (!material.files) {
						material.files = [];
					}
				}

				console.log(`✅ Final materials for piece ${pieceId}:`, materials);
				materialsData[pieceId] = materials;
				return materials;
			}
		} catch (error) {
			console.error('Error loading materials for piece:', pieceId, error);
		}

		return [];
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
					alert('Erreur lors du téléchargement du fichier');
				}
			} catch (error) {
				console.error('Error downloading file:', error);
				alert('Erreur lors du téléchargement: ' + error.message);
			}
		}
	}

	// ✅ SUPPRESSION DE FICHIER DE MATÉRIEL AVEC MISE À JOUR LOCALE
	async function deleteMaterialFile(fileId: number, fileName: string, materialId: number) {
		if (!confirm(`Êtes-vous sûr de vouloir supprimer "${fileName}" ?`)) {
			return;
		}

		try {
			const response = await fetch(`/api/filesystem/files/${fileId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				console.log(`✅ File ${fileName} deleted successfully`);

				// ✅ MISE À JOUR LOCALE IMMÉDIATE
				// Trouver le matériel et supprimer le fichier de son tableau
				for (const pieceId in materialsData) {
					const materials = materialsData[pieceId];
					const material = materials.find(m => m.id === materialId);

					if (material && material.files) {
						// Supprimer le fichier du tableau local
						const fileIndex = material.files.findIndex(f => f.id === fileId);
						if (fileIndex !== -1) {
							material.files.splice(fileIndex, 1);
							console.log(`🗑️ Removed file from local cache. Remaining files: ${material.files.length}`);
						}
					}
				}

				// ✅ FORCER LA RÉACTIVITÉ
				materialsData = { ...materialsData };

				// ✅ DISPATCH POUR NOTIFIER LE PARENT
				dispatch('refresh');

			} else {
				console.error('Delete failed:', response.status);
				alert('Erreur lors de la suppression');
			}
		} catch (error) {
			console.error('Error deleting material file:', error);
			alert('Erreur lors de la suppression: ' + error.message);
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
				} else {
					console.error('Delete failed:', response.status);
					alert('Erreur lors de la suppression');
				}
			} catch (error) {
				console.error('Error deleting item:', error);
				alert('Erreur lors de la suppression: ' + error.message);
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
				} else {
					console.error('Rename failed:', response.status);
					alert('Erreur lors du renommage');
				}
			} catch (error) {
				console.error('Error renaming item:', error);
				alert('Erreur lors du renommage: ' + error.message);
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

	// ✅ GESTION DES MATÉRIELS
	async function toggleMaterialExpansion(materialId: number, pieceId: number) {
		if (expandedMaterials.has(materialId)) {
			expandedMaterials.delete(materialId);
		} else {
			expandedMaterials.add(materialId);
		}
		expandedMaterials = new Set(expandedMaterials); // Force reactivity
	}

	function openMaterialUploader(materialId: number) {
		showMaterialUploader[materialId] = true;
		showMaterialUploader = { ...showMaterialUploader };
	}

	function closeMaterialUploader(materialId: number) {
		showMaterialUploader[materialId] = false;
		showMaterialUploader = { ...showMaterialUploader };
	}

	// ✅ UPLOAD vers un matériel AVEC MISE À JOUR LOCALE
	async function handleMaterialFileUpload(materialId: number, files: FileList) {
		if (!files || files.length === 0) return;

		console.log('📤 Uploading files to material:', materialId);

		const formData = new FormData();
		Array.from(files).forEach((file) => {
			formData.append('files', file);
		});

		try {
			const response = await fetch(`/api/materials/${materialId}/files`, {
				method: 'POST',
				body: formData
			});

			const responseData = await response.json();

			if (response.ok && responseData.success) {
				console.log('✅ Upload successful to material');

				// ✅ MISE À JOUR LOCALE IMMÉDIATE
				// Ajouter les nouveaux fichiers au tableau local
				if (responseData.files) {
					for (const pieceId in materialsData) {
						const materials = materialsData[pieceId];
						const material = materials.find(m => m.id === materialId);

						if (material) {
							if (!material.files) {
								material.files = [];
							}
							// Ajouter les nouveaux fichiers
							material.files.push(...responseData.files);
							console.log(`📁 Added ${responseData.files.length} files to local cache. Total files: ${material.files.length}`);
						}
					}
				}

				// ✅ FORCER LA RÉACTIVITÉ
				materialsData = { ...materialsData };

				dispatch('refresh');
				closeMaterialUploader(materialId);
			} else {
				console.error('❌ Upload failed:', responseData);
				alert('Erreur lors de l\'upload: ' + (responseData.error || 'Erreur inconnue'));
			}
		} catch (error) {
			console.error('❌ Upload error:', error);
			alert('Erreur lors de l\'upload: ' + error.message);
		}
	}

	// ✅ Télécharger un fichier de matériel
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
			alert('Erreur lors du téléchargement');
		}
	}

	// ✅ Prévisualiser un fichier de matériel
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

	// ✅ Gérer l'input file pour matériel
	function handleMaterialFileInput(materialId: number, event: Event) {
		const input = event.target as HTMLInputElement;
		if (input.files && input.files.length > 0) {
			handleMaterialFileUpload(materialId, input.files);
			input.value = ''; // Reset input
		}
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
				{@const materialsList = materialsData[item.pieceId] || item.materials || []}

				<div class="bg-gray-50 rounded-lg border border-gray-200 hover:border-[#6B9AD9] transition-all duration-200">
					<!-- Élément principal (fichier ou dossier) -->
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
											{#if materialsList.length > 0}
												• {materialsList.length} matériel{materialsList.length !== 1 ? 's' : ''}
											{/if}
										{/if}
									</p>
									<p class="text-sm text-gray-500">
										{formatDate(item.updatedAt)}
									</p>
									{#if item.type === 'folder' && item.children}
										<p class="text-sm text-gray-500">
											{item.children.length} élément{item.children.length !== 1 ? 's' : ''}
										</p>
									{/if}
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

					<!-- ✅ SECTION DES MATÉRIELS SIMPLIFIÉE -->
					{#if showMaterials && item.type === 'folder' && item.pieceId && materialsData[item.pieceId]}
						{@const materials = materialsData[item.pieceId]}
						{#if materials.length > 0}
							<div class="border-t border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
								<div class="p-3">
									<h5 class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
										<Package size={14} class="text-blue-600" />
										Matériels de cette pièce ({materials.length})
									</h5>

									<div class="space-y-2">
										{#each materials as material}
											<div class="bg-white border border-blue-200 rounded-lg overflow-hidden">
												<!-- En-tête du matériel -->
												<div class="p-3">
													<div class="flex items-center justify-between">
														<div class="flex items-center gap-2 flex-1">
															<button
																class="p-1 hover:bg-gray-100 rounded transition-colors"
																on:click={() => toggleMaterialExpansion(material.id, item.pieceId)}
															>
																{#if expandedMaterials.has(material.id)}
																	<ChevronDown size={14} class="text-gray-600" />
																{:else}
																	<ChevronRight size={14} class="text-gray-600" />
																{/if}
															</button>

															<div class="flex-1">
																<div class="flex items-center gap-2">
																	<h6 class="font-medium text-gray-800">{material.name}</h6>
																	{#if material.is_default}
																		<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
																			Défaut
																		</span>
																	{/if}
																</div>
																<div class="flex items-center gap-4 mt-1 text-xs text-gray-500">
																	<span>{material.files?.length || 0} fichier{(material.files?.length || 0) !== 1 ? 's' : ''}</span>
																	{#if material.edition}
																		<span>Édition: {material.edition}</span>
																	{/if}
																	{#if material.editor}
																		<span>Éditeur: {material.editor}</span>
																	{/if}
																</div>
															</div>
														</div>

														<!-- Actions du matériel -->
														<div class="flex items-center gap-1">
															<input
																type="file"
																multiple
																accept=".pdf,.musicxml,.mxl,.mid,.midi,.jpg,.jpeg,.png,.doc,.docx,.txt,.zip"
																style="display: none;"
																id="material-upload-{material.id}"
																on:change={(e) => handleMaterialFileInput(material.id, e)}
															/>
															<button
																class="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
																on:click={() => document.getElementById(`material-upload-${material.id}`)?.click()}
																title="Ajouter des fichiers"
															>
																<Upload size={14} />
															</button>
														</div>
													</div>

													{#if material.description}
														<p class="text-sm text-gray-600 mt-2">{material.description}</p>
													{/if}
												</div>

												<!-- ✅ Fichiers du matériel (si expanded) -->
												{#if expandedMaterials.has(material.id)}
													<div class="border-t border-blue-100 bg-blue-25">
														{#if material.files && material.files.length > 0}
															<div class="p-3 space-y-2">
																{#each material.files as file}
																	<div class="flex items-center justify-between p-2 bg-white border border-gray-200 rounded hover:border-blue-300 transition-colors group">
																		<div class="flex items-center gap-2 flex-1 min-w-0">
																			<svelte:component
																				this={getFileIcon({...file, type: 'file'})}
																				size={16}
																				class={getFileColor({...file, type: 'file'})}
																			/>
																			<span class="text-sm font-medium text-gray-700 truncate">{file.name}</span>
																			<span class="text-xs text-gray-500">{formatFileSize(file.size || 0)}</span>
																			{#if file.instrument_part}
																				<span class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
																					{file.instrument_part}
																				</span>
																			{/if}
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
																			<button
																				class="p-1 text-gray-600 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
																				on:click={() => deleteMaterialFile(file.id, file.name, material.id)}
																				title="Supprimer"
																			>
																				<Trash2 size={14} />
																			</button>
																		</div>
																	</div>
																{/each}
															</div>
														{:else}
															<div class="p-4 text-center text-gray-500">
																<FileText class="mx-auto mb-2" size={24} />
																<p class="text-sm">Aucun fichier dans ce matériel</p>
																<button
																	class="text-xs text-blue-600 hover:text-blue-700 mt-1"
																	on:click={() => document.getElementById(`material-upload-${material.id}`)?.click()}
																>
																	Ajouter des fichiers
																</button>
															</div>
														{/if}
													</div>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							</div>
						{/if}
					{:else if showMaterials && item.type === 'folder' && item.pieceId && !materialsData[item.pieceId]}
						<!-- Indicateur de chargement -->
						<div class="border-t border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-3">
							<div class="flex items-center gap-2">
								<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
								<span class="text-sm text-gray-600">Chargement des matériels...</span>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Menu contextuel -->
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

<!-- Modal de prévisualisation -->
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