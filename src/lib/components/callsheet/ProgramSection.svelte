<script lang="ts">
	import type { Callsheet } from '$lib/types/Callsheet';
	import Accordion from '$lib/components/Accordion.svelte';
	import { Download, Music, FileText, Eye, AlertCircle, Clock, ChevronDown, ChevronRight, Package, Star, Search } from 'lucide-svelte';
	import FilePreview from '$lib/components/filesystem/FilePreview.svelte';
	import { onMount } from 'svelte';

	export let callsheet: Callsheet;

	let showPreview = false;
	let currentPreviewFile: { id: number; name: string; type: string } | null = null;
	let downloadingFiles = new Set<number>();
	let downloadErrors = new Map<number, string>();
	let expandedPieces = new Set<number>();
	let expandedMaterials = new Map<string, boolean>();
	let searchQuery = '';
	let materialsData: Record<number, any[]> = {};
	let isLoadingMaterials = false;

	// Charger les matériels pour chaque pièce au montage
	onMount(async () => {
		await loadAllMaterials();
	});

	async function loadAllMaterials() {
		if (!callsheet.project?.pieces) return;

		isLoadingMaterials = true;

		try {
			for (const piece of callsheet.project.pieces) {
				console.log(`Loading materials for piece: ${piece.name} (ID: ${piece.id})`);

				const response = await fetch(`/api/materials/piece/${piece.id}`);
				if (response.ok) {
					const materials = await response.json();
					console.log(`Loaded ${materials.length} materials for piece ${piece.name}:`, materials);

					// Les matériels devraient déjà contenir les fichiers via la relation hasMany
					for (const material of materials) {
						console.log(`Material ${material.name} has files:`, material.files);
						console.log(`Material ${material.name} files_count:`, material.files_count);

						// S'assurer que les fichiers sont présents
						if (!material.files) {
							material.files = [];
						}
					}

					materialsData[piece.id] = materials;
				} else {
					console.error(`Failed to load materials for piece ${piece.id}:`, response.status, response.statusText);
					materialsData[piece.id] = [];
				}
			}

			console.log('Final materialsData:', materialsData);
			materialsData = { ...materialsData }; // Force reactivity
		} catch (error) {
			console.error('Error loading materials:', error);
		}

		isLoadingMaterials = false;
	}

	// Fonction utilitaire pour formater la taille des fichiers
	function formatFileSize(bytes: number | null | undefined): string {
		if (!bytes || bytes === 0) return '';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	// Fonction améliorée de téléchargement avec loading state
	async function downloadFile(fileId: number, fileName: string) {
		if (downloadingFiles.has(fileId)) return;

		downloadingFiles.add(fileId);
		downloadingFiles = downloadingFiles; // Force reactivity
		downloadErrors.delete(fileId);
		downloadErrors = downloadErrors;

		try {
			console.log(`Starting download for file ${fileId}: ${fileName}`);

			const response = await fetch(`/api/files/download/${fileId}`);

			if (!response.ok) {
				throw new Error(`Download failed: ${response.status} ${response.statusText}`);
			}

			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);

			console.log(`Download completed for: ${fileName}`);
		} catch (error) {
			console.error('Download error:', error);
			downloadErrors.set(fileId, error.message);
			downloadErrors = downloadErrors;
		} finally {
			downloadingFiles.delete(fileId);
			downloadingFiles = downloadingFiles;
		}
	}

	function previewFile(fileId: number, fileName: string, fileType: string = '') {
		currentPreviewFile = { id: fileId, name: fileName, type: fileType };
		showPreview = true;
	}

	function getFileIcon(fileName: string) {
		const extension = fileName.split('.').pop()?.toLowerCase();
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
				return Eye;
			case 'mp3':
			case 'wav':
			case 'flac':
			case 'aac':
				return Music;
			default:
				return Music;
		}
	}

	function getFileColor(fileName: string) {
		return 'text-gray-700 bg-gray-100 border-gray-300';
	}

	function togglePieceExpansion(pieceId: number) {
		if (expandedPieces.has(pieceId)) {
			expandedPieces.delete(pieceId);
		} else {
			expandedPieces.add(pieceId);
		}
		expandedPieces = new Set(expandedPieces);
	}

	function toggleMaterialExpansion(pieceId: number, materialId: number) {
		const key = `${pieceId}-${materialId}`;
		expandedMaterials[key] = !expandedMaterials[key];
		expandedMaterials = { ...expandedMaterials };
	}

	// Filtrage par recherche
	function filterFiles(files: any[], query: string) {
		if (!query.trim()) return files;
		return files.filter(file =>
			file.name.toLowerCase().includes(query.toLowerCase())
		);
	}

	// Compter le total de fichiers pour une pièce
	function getTotalFilesCount(pieceId: number): number {
		const materials = materialsData[pieceId] || [];
		return materials.reduce((total, material) => {
			// Utiliser la longueur réelle du tableau de fichiers si disponible
			const actualFilesCount = material.files?.length || 0;
			return total + actualFilesCount;
		}, 0);
	}

	// Obtenir le matériel par défaut
	function getDefaultMaterial(pieceId: number) {
		const materials = materialsData[pieceId] || [];
		return materials.find(m => m.is_default) || materials[0] || null;
	}

	// Auto-clear errors after 5 seconds
	$: {
		if (downloadErrors.size > 0) {
			setTimeout(() => {
				downloadErrors.clear();
				downloadErrors = downloadErrors;
			}, 5000);
		}
	}
</script>

<div class="mb-10 py-8">
	<div class="text-center mb-6">
		<h2 class="text-2xl font-bold text-slate-500 dark:text-white mb-2">
			Program and Materials
		</h2>
		<p class="text-sm text-gray-600 dark:text-gray-400">
			Access all musical materials and scores for this project
		</p>
	</div>


	{#if isLoadingMaterials}
		<div class="flex justify-center items-center h-32">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
		</div>
	{:else if callsheet.project?.pieces && callsheet.project.pieces.length > 0}
		<div class="max-w-6xl mx-auto space-y-2">
			{#each callsheet.project.pieces as piece}
				{@const materials = materialsData[piece.id] || []}
				{@const defaultMaterial = getDefaultMaterial(piece.id)}
				{@const totalFiles = getTotalFilesCount(piece.id)}
				{@const isExpanded = expandedPieces.has(piece.id)}

				<div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
					<!-- En-tête de la pièce - ULTRA COMPACT -->
					<div class="p-2 sm:p-1 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-600">
						<button
							class="w-full flex items-center justify-between text-left hover:bg-white hover:bg-opacity-50 rounded p-1 transition-colors"
							on:click={() => togglePieceExpansion(piece.id)}
						>
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 sm:gap-1">
									<div class="flex-shrink-0">
										{#if isExpanded}
											<ChevronDown size={14} class="text-gray-600 dark:text-gray-300 sm:w-3 sm:h-3" />
										{:else}
											<ChevronRight size={14} class="text-gray-600 dark:text-gray-300 sm:w-3 sm:h-3" />
										{/if}
									</div>
									<div class="flex-1 min-w-0">
										<h3 class="font-semibold text-base sm:text-xs text-gray-900 dark:text-white truncate">
											{piece.name}
										</h3>
										<div class="flex items-center gap-2 sm:gap-1 text-xs sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5 sm:mt-0">
											<span>{piece.composer.shortName}</span>
											{#if piece.opus}
												<span class="hidden sm:inline">Op. {piece.opus}</span>
											{/if}
											{#if piece.yearOfComposition}
												<span class="hidden sm:inline">({piece.yearOfComposition})</span>
											{/if}
										</div>
									</div>
								</div>
								<!-- Mobile: info supplémentaire en dessous -->
								<div class="sm:hidden mt-1 flex items-center gap-2 text-xs text-gray-600">
									{#if piece.opus}
										<span>Op. {piece.opus}</span>
									{/if}
									{#if piece.yearOfComposition}
										<span>({piece.yearOfComposition})</span>
									{/if}
								</div>
							</div>
							<div class="flex items-center gap-1 sm:gap-1 text-xs flex-shrink-0">
								<div class="flex items-center gap-0.5 px-1.5 py-0.5 sm:px-1 sm:py-0.5 bg-blue-100 text-blue-800 rounded-full">
									<Package size={10} class="sm:w-2.5 sm:h-2.5" />
									<span class="sm:hidden text-xs">{materials.length}</span>
									<span class="hidden sm:inline text-xs">{materials.length}</span>
								</div>
								<div class="flex items-center gap-0.5 px-1.5 py-0.5 sm:px-1 sm:py-0.5 bg-green-100 text-green-800 rounded-full">
									<FileText size={10} class="sm:w-2.5 sm:h-2.5" />
									<span class="sm:hidden text-xs">{totalFiles}</span>
									<span class="hidden sm:inline text-xs">{totalFiles}</span>
								</div>
							</div>
						</button>
					</div>

					<!-- Contenu expandable -->
					{#if isExpanded}
						<div class="p-3 sm:p-2">
							{#if materials.length === 0}
								<div class="text-center py-8 sm:py-4">
									<Package class="mx-auto mb-4 sm:mb-2 text-gray-400" size={48} />
									<p class="text-gray-500 dark:text-gray-400">No materials available for this piece</p>
								</div>
							{:else}
								<div class="space-y-3 sm:space-y-2">
									{#each materials as material}
										{@const isMatExpanded = expandedMaterials[`${piece.id}-${material.id}`]}
										{@const filteredFiles = material.files ? filterFiles(material.files, searchQuery) : []}

										<div class="border border-gray-200 dark:border-gray-600 rounded-lg sm:rounded overflow-hidden">
											<!-- En-tête du matériel - TRÈS COMPACT -->
											<div class="px-3 py-2 sm:px-2 sm:py-1 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
												<button
													class="w-full flex items-center justify-between text-left hover:bg-white hover:bg-opacity-50 rounded p-1 transition-colors"
													on:click={() => toggleMaterialExpansion(piece.id, material.id)}
												>
													<div class="flex items-center gap-2 sm:gap-1 flex-1 min-w-0">
														{#if isMatExpanded}
															<ChevronDown size={14} class="text-gray-500 sm:w-3 sm:h-3" />
														{:else}
															<ChevronRight size={14} class="text-gray-500 sm:w-3 sm:h-3" />
														{/if}
														<div class="flex items-center gap-2 sm:gap-1 min-w-0">
															<h4 class="font-medium text-sm sm:text-xs text-gray-900 dark:text-white truncate">
																{material.name}
															</h4>
															{#if material.is_default}
																<Star class="text-yellow-500 fill-current flex-shrink-0 sm:w-3 sm:h-3" size={12} />
															{/if}
														</div>
														{#if material.edition}
															<span class="hidden sm:inline px-1 py-0.5 bg-blue-100 text-blue-800 rounded text-xs flex-shrink-0">
																{material.edition}
															</span>
														{/if}
													</div>
													<div class="flex items-center gap-1 text-sm sm:text-xs flex-shrink-0">
														<FileText size={12} class="text-gray-500 sm:w-3 sm:h-3" />
														<span class="text-gray-600 dark:text-gray-400">
															{material.files?.length || 0}
														</span>
													</div>
												</button>

												<!-- Édition sur mobile -->
												{#if material.edition}
													<div class="sm:hidden mt-1">
														<span class="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
															{material.edition}
														</span>
													</div>
												{/if}
											</div>

											<!-- Fichiers du matériel -->
											{#if isMatExpanded}
												<div class="p-3 sm:p-2">
													{#if material.description}
														<div class="mb-3 sm:mb-2 p-2 sm:p-1 bg-blue-50 dark:bg-blue-900 rounded text-sm sm:text-xs text-blue-800 dark:text-blue-200">
															{material.description}
														</div>
													{/if}

													{#if filteredFiles.length === 0}
														<div class="text-center py-6 sm:py-3">
															<FileText class="mx-auto mb-2 sm:mb-1 text-gray-400 sm:w-6 sm:h-6" size={32} />
															<p class="text-gray-500 dark:text-gray-400 text-sm sm:text-xs">
																{searchQuery ? 'No files match your search' : 'No files in this material'}
															</p>
														</div>
													{:else}
														<!-- Grille de fichiers RESPONSIVE -->
														<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-1">
															{#each filteredFiles as file}
																{@const isDownloading = downloadingFiles.has(file.id)}
																{@const downloadError = downloadErrors.get(file.id)}

																<div class="flex items-center gap-3 sm:gap-1 p-3 sm:p-1 {getFileColor(file.name)} rounded-lg sm:rounded border hover:shadow-sm transition-all duration-200">
																	<div class="flex-shrink-0">
																		<svelte:component this={getFileIcon(file.name)} size={16} class="sm:w-3 sm:h-3" />
																	</div>
																	<div class="flex-1 min-w-0">
																		<div class="text-sm sm:text-xs font-medium truncate" title={file.name}>
																			<!-- Mobile: nom complet, Desktop: tronqué -->
																			<span class="sm:hidden">{file.name}</span>
																			<span class="hidden sm:inline">
																				{file.name.length > 10 ? file.name.substring(0, 10) + '...' : file.name}
																			</span>
																		</div>
																		{#if file.size}
																			<div class="text-xs sm:text-xs text-gray-500 mt-1 sm:mt-0">
																				{formatFileSize(file.size)}
																			</div>
																		{/if}
																		{#if file.instrument_part}
																			<div class="sm:hidden mt-1">
																				<span class="inline-block px-1 py-0.5 bg-gray-200 rounded text-xs">
																					{file.instrument_part}
																				</span>
																			</div>
																		{/if}
																	</div>
																	<div class="flex gap-1 sm:gap-0.5 flex-shrink-0">
																		<button
																			class="p-1.5 sm:p-0.5 hover:bg-white hover:bg-opacity-70 rounded transition-colors disabled:opacity-50"
																			on:click={() => previewFile(file.id, file.name, file.type || '')}
																			disabled={isDownloading}
																			title="Preview"
																		>
																			<Eye size={14} class="sm:w-2.5 sm:h-2.5" />
																		</button>
																		<button
																			class="p-1.5 sm:p-0.5 hover:bg-white hover:bg-opacity-70 rounded transition-colors disabled:opacity-50"
																			on:click={() => downloadFile(file.id, file.name)}
																			disabled={isDownloading}
																			title="Download"
																		>
																			{#if isDownloading}
																				<div class="animate-spin rounded-full h-3.5 w-3.5 sm:h-2 sm:w-2 border-b-2 border-current"></div>
																			{:else}
																				<Download size={14} class="sm:w-2.5 sm:h-2.5" />
																			{/if}
																		</button>
																	</div>
																</div>

																{#if downloadError}
																	<div class="col-span-full text-sm sm:text-xs text-red-600 dark:text-red-400 px-3 sm:px-1">
																		Error: {downloadError}
																	</div>
																{/if}
															{/each}
														</div>

														<!-- Informations additionnelles du matériel -->
														{#if material.notes || material.editor}
															<div class="mt-4 sm:mt-2 pt-3 sm:pt-1 border-t border-gray-200 dark:border-gray-600">
																<div class="text-sm sm:text-xs space-y-1 sm:space-y-0">
																	{#if material.editor}
																		<div class="text-gray-600 dark:text-gray-400">
																			<span class="font-medium">Publisher:</span> {material.editor}
																		</div>
																	{/if}
																	{#if material.notes}
																		<div class="text-gray-600 dark:text-gray-400">
																			<span class="font-medium">Notes:</span>
																			<span class="sm:truncate sm:inline-block sm:max-w-full" title={material.notes}>
																				{material.notes}
																			</span>
																		</div>
																	{/if}
																</div>
															</div>
														{/if}
													{/if}
												</div>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center py-12">
			<Music class="mx-auto mb-4 text-gray-400" size={64} />
			<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No pieces in this project</h3>
			<p class="text-gray-500 dark:text-gray-400">Add pieces to the project to see materials and scores here.</p>
		</div>
	{/if}
</div>

<!-- File Preview Modal -->
{#if showPreview && currentPreviewFile}
	<FilePreview
		fileId={currentPreviewFile.id}
		fileName={currentPreviewFile.name}
		fileType={currentPreviewFile.type}
		onClose={() => {
			showPreview = false;
			currentPreviewFile = null;
		}}
	/>
{/if}

<style>
    /* Optimisations pour mobile */
    @media (max-width: 640px) {
        .truncate {
            max-width: 200px;
        }
    }

    /* Transitions fluides */
    .transition-all {
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Amélioration des hover states */
    .hover\:shadow-sm:hover {
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
</style>