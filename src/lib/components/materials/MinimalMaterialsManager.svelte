<!-- src/lib/components/materials/MinimalMaterialsManager.svelte -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import {
		Package,
		Plus,
		Music,
		FileText,
		Trash2,
		Star,
		Edit3,
		Upload,
		CheckCircle,
		Circle,
		ChevronDown,
		ChevronRight,
		Download,
		File,
		Image
	} from 'lucide-svelte';

	const dispatch = createEventDispatcher();

	export let projectId: number | null = null;

	let materials: any[] = [];
	let pieces: any[] = [];
	let selectedPiece: any = null;
	let isLoading = true;
	let showCreateForm = false;
	let newMaterialData = {
		name: '',
		description: '',
		edition: '',
		editor: '',
		notes: '',
		is_default: false
	};

	let selectedMaterials: Record<number, number | null> = {};
	let expandedMaterials = new Set<number>();

	onMount(async () => {
		await loadPieces();
		isLoading = false;
	});

	async function loadPieces() {
		try {
			const response = await fetch('/api/pieces?limit=1000&page=1&filter=&orderBy=name&order=asc');
			if (response.ok) {
				const data = await response.json();
				pieces = data.data || data || [];
			}
		} catch (error) {
			console.error('Error loading pieces:', error);
		}
	}

	async function loadMaterialsForPiece(piece: any) {
		try {
			selectedPiece = piece;

			const response = await fetch(`/api/materials/piece/${piece.id}`);
			if (response.ok) {
				const materialsData = await response.json();

				const materialPromises = materialsData.map(async (material) => {
					try {
						const filesResponse = await fetch(`/api/materials/${material.id}/files`);
						if (filesResponse.ok) {
							const files = await filesResponse.json();
							material.files = Array.isArray(files) ? files : [];
							material.files_count = material.files.length;
						} else {
							material.files = material.files || [];
							material.files_count = material.files_count || 0;
						}
						return material;
					} catch (error) {
						material.files_count = material.files_count || 0;
						return material;
					}
				});

				materials = await Promise.all(materialPromises);
			} else {
				materials = [];
			}

			await loadSelectedMaterialForPiece(piece.id);
		} catch (error) {
			materials = [];
		}
	}

	async function loadSelectedMaterialForPiece(pieceId: number) {
		try {
			const response = await fetch(`/api/pieces/${pieceId}/select-material`);
			if (response.ok) {
				const result = await response.json();
				selectedMaterials[pieceId] = result.materialId;
			} else {
				selectedMaterials[pieceId] = null;
			}
			selectedMaterials = { ...selectedMaterials };
		} catch (error) {
			selectedMaterials[pieceId] = null;
		}
	}

	async function selectMaterial(pieceId: number, materialId: number | null) {
		try {
			const response = await fetch(`/api/pieces/${pieceId}/select-material`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ materialId })
			});

			if (response.ok) {
				selectedMaterials[pieceId] = materialId;
				selectedMaterials = { ...selectedMaterials };
				dispatch('materialsUpdated');
				window.dispatchEvent(new CustomEvent('materialSelectionChanged', {
					detail: { pieceId, materialId }
				}));
			}
		} catch (error) {
			console.error('Error selecting material:', error);
		}
	}

	function formatFileSize(bytes: number): string {
		if (!bytes || bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	function toggleMaterialExpansion(materialId: number) {
		if (expandedMaterials.has(materialId)) {
			expandedMaterials.delete(materialId);
		} else {
			expandedMaterials.add(materialId);
		}
		expandedMaterials = new Set(expandedMaterials);
	}

	function getSelectedMaterial(pieceId: number): any | null {
		const materialId = selectedMaterials[pieceId];
		if (!materialId) return null;
		return materials.find(m => m.id === materialId) || null;
	}
</script>

<div class="space-y-6">
	{#if isLoading}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B9AD9]"></div>
		</div>
	{:else if !selectedPiece}
		<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
			<div class="mb-6">
				<h2 class="text-2xl font-bold text-gray-700 uppercase">Gestion des matériels</h2>
				<p class="text-gray-500 mt-1">Sélectionnez une pièce pour gérer ses matériels</p>
			</div>

			{#if pieces.length === 0}
				<div class="text-center py-8">
					<Music class="mx-auto mb-4 text-gray-400" size={48} />
					<p class="text-gray-500">Aucune pièce disponible</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each pieces as piece}
						<button
							class="p-4 bg-gradient-to-br from-white to-gray-50 border-2 border-[#E7E7E7] rounded-xl hover:border-[#6B9AD9] transition-all duration-300 text-left group"
							on:click={() => loadMaterialsForPiece(piece)}
						>
							<div class="flex items-center gap-3">
								<div class="p-3 bg-blue-500 text-white rounded-lg group-hover:scale-110 transition-transform">
									<Music size={24} />
								</div>
								<div class="flex-1 min-w-0">
									<h3 class="font-semibold text-lg text-gray-700 truncate">{piece.name}</h3>
									<p class="text-sm text-gray-500 truncate">
										{piece.composer?.shortName || piece.composer?.longName || 'Compositeur inconnu'}
									</p>
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
			<div class="flex items-center justify-between mb-6">
				<div>
					<button
						class="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-2"
						on:click={() => selectedPiece = null}
					>
						← Retour aux pièces
					</button>
					<h2 class="text-2xl font-bold text-gray-700 uppercase">Matériels</h2>
					<p class="text-gray-500 mt-1">{selectedPiece.name}</p>
				</div>
			</div>

			{#if materials.length === 0}
				<div class="text-center py-8">
					<Package class="mx-auto mb-4 text-gray-400" size={48} />
					<p class="text-gray-500">Aucun matériel créé pour cette pièce</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each materials as material}
						{@const isSelected = selectedMaterials[selectedPiece.id] === material.id}
						<div class="border border-gray-200 rounded-lg p-4 {isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-white'}">
							<div class="flex items-start justify-between">
								<div class="flex items-start gap-4 flex-1">
									<button
										class="p-1 hover:bg-gray-100 rounded transition-colors"
										on:click={() => selectMaterial(selectedPiece.id, isSelected ? null : material.id)}
									>
										{#if isSelected}
											<CheckCircle class="text-blue-600" size={24} />
										{:else}
											<Circle class="text-gray-400" size={24} />
										{/if}
									</button>

									<div class="flex-1 min-w-0">
										<h3 class="text-lg font-semibold text-gray-800">{material.name}</h3>

										<div class="flex items-center gap-4 text-sm mt-2">
											<div>
												<span class="font-medium text-gray-700">Fichiers :</span>
												<div class="flex items-center gap-2">
													<span class="text-gray-600 font-semibold">{material.files_count || 0}</span>
													{#if material.files_count > 0}
														<button
															class="text-blue-600 hover:text-blue-800"
															on:click={() => toggleMaterialExpansion(material.id)}
														>
															{#if expandedMaterials.has(material.id)}
																<ChevronDown size={16} />
															{:else}
																<ChevronRight size={16} />
															{/if}
														</button>
													{/if}
												</div>
											</div>
										</div>

										{#if expandedMaterials.has(material.id) && material.files && material.files.length > 0}
											<div class="mt-4 border-t pt-4">
												<h4 class="text-sm font-medium text-gray-700 mb-3">
													Fichiers ({material.files.length})
												</h4>
												<div class="space-y-2">
													{#each material.files as file}
														<div class="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
															<div class="flex items-center gap-3 flex-1">
																<div class="flex-shrink-0">
																	{#if file.name.toLowerCase().endsWith('.pdf')}
																		<FileText class="text-red-600" size={20} />
																	{:else if file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)}
																		<Image class="text-green-600" size={20} />
																	{:else}
																		<File class="text-gray-600" size={20} />
																	{/if}
																</div>
																<div class="flex-1">
																	<p class="text-sm font-medium text-gray-900">{file.name}</p>
																	<p class="text-xs text-gray-500">
																		{formatFileSize(file.size || 0)} • {formatDate(file.createdAt)}
																	</p>
																</div>
															</div>
														</div>
													{/each}
												</div>
											</div>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>