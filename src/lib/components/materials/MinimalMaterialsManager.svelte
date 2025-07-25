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
		Upload
	} from 'lucide-svelte';

	const dispatch = createEventDispatcher();

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
				console.log('✅ Loaded pieces:', pieces.length);
			}
		} catch (error) {
			console.error('Error loading pieces:', error);
		}
	}

	async function loadMaterialsForPiece(piece: any) {
		try {
			selectedPiece = piece;
			console.log(`🔄 Loading materials for piece: ${piece.name}`);

			const response = await fetch(`/api/materials/piece/${piece.id}`);
			if (response.ok) {
				const materialsData = await response.json();
				console.log(`📦 Loaded ${materialsData.length} materials from API`);

				// ✅ SOLUTION DÉFINITIVE : Charger les fichiers réels en parallèle
				const materialPromises = materialsData.map(async (material) => {
					try {
						// Garder le count original comme fallback
						const originalCount = material.files_count || material.files?.length || 0;

						// Essayer de récupérer les fichiers réels
						const filesResponse = await fetch(`/api/materials/${material.id}/files`);
						if (filesResponse.ok) {
							const files = await filesResponse.json();
							material.files = Array.isArray(files) ? files : [];
							material.files_count = material.files.length;
						} else {
							// Fallback vers les données originales
							material.files_count = originalCount;
							material.files = material.files || [];
						}

						return material;
					} catch (error) {
						console.error(`Error loading files for material ${material.id}:`, error);
						// En cas d'erreur, utiliser les données existantes
						material.files_count = material.files_count || material.files?.length || 0;
						return material;
					}
				});

				// Attendre le traitement de tous les matériels
				materials = await Promise.all(materialPromises);

				console.log(`✅ Final materials with file counts:`,
					materials.map(m => ({
						name: m.name,
						files_count: m.files_count
					}))
				);

				// Forcer la réactivité
				materials = [...materials];
			} else {
				console.error(`❌ Failed to load materials for piece ${piece.id}`);
				materials = [];
			}
		} catch (error) {
			console.error('Error loading materials for piece:', piece.id, error);
			materials = [];
		}
	}

	async function createMaterial() {
		if (!newMaterialData.name.trim() || !selectedPiece) {
			alert('Veuillez remplir tous les champs obligatoires');
			return;
		}

		try {
			const materialData = {
				...newMaterialData,
				piece_id: selectedPiece.id
			};

			const response = await fetch('/api/materials', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(materialData)
			});

			if (response.ok) {
				await loadMaterialsForPiece(selectedPiece);
				showCreateForm = false;
				newMaterialData = {
					name: '',
					description: '',
					edition: '',
					editor: '',
					notes: '',
					is_default: false
				};
				dispatch('materialsUpdated');
			} else {
				const error = await response.json();
				alert('Erreur lors de la création: ' + (error.message || 'Erreur inconnue'));
			}
		} catch (error) {
			console.error('Error creating material:', error);
			alert('Erreur lors de la création du matériel');
		}
	}

	async function deleteMaterial(material: any) {
		if (!confirm(`Êtes-vous sûr de vouloir supprimer le matériel "${material.name}" ?`)) {
			return;
		}

		try {
			const response = await fetch(`/api/materials/${material.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				if (selectedPiece) {
					await loadMaterialsForPiece(selectedPiece);
				}
				dispatch('materialsUpdated');
			} else {
				alert('Erreur lors de la suppression');
			}
		} catch (error) {
			console.error('Error deleting material:', error);
			alert('Erreur lors de la suppression du matériel');
		}
	}

	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	function getPieceName(piece: any): string {
		return `${piece.name} - ${piece.composer?.shortName || piece.composer?.longName || ''}`;
	}

	function goBackToPieces() {
		selectedPiece = null;
		materials = [];
	}
</script>

<div class="space-y-6">
	{#if isLoading}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B9AD9]"></div>
		</div>
	{:else if !selectedPiece}
		<!-- Sélection de pièce -->
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
									{#if piece.opus}
										<p class="text-xs text-gray-400">Op. {piece.opus}</p>
									{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<!-- Gestion des matériels de la pièce sélectionnée -->
		<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
			<div class="flex items-center justify-between mb-6">
				<div>
					<button
						class="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-2"
						on:click={goBackToPieces}
					>
						← Retour aux pièces
					</button>
					<h2 class="text-2xl font-bold text-gray-700 uppercase">Matériels</h2>
					<p class="text-gray-500 mt-1">{getPieceName(selectedPiece)}</p>
				</div>

				<button
					class="flex items-center gap-2 px-6 py-3 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors font-semibold"
					on:click={() => showCreateForm = true}
				>
					<Plus size={20} />
					Nouveau matériel
				</button>
			</div>

			<!-- Liste des matériels -->
			{#if materials.length === 0}
				<div class="text-center py-8">
					<Package class="mx-auto mb-4 text-gray-400" size={48} />
					<p class="text-gray-500 mb-4">Aucun matériel créé pour cette pièce</p>
					<button
						class="text-[#6B9AD9] hover:underline"
						on:click={() => showCreateForm = true}
					>
						Créer le premier matériel
					</button>
				</div>
			{:else}
				<div class="space-y-4">
					{#each materials as material}
						<div class="border border-gray-200 rounded-lg p-4 hover:border-[#6B9AD9] transition-all duration-200 {material.is_default ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}">
							<div class="flex items-start justify-between">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-2">
										<h3 class="text-lg font-semibold text-gray-800">{material.name}</h3>
										{#if material.is_default}
											<Star class="text-yellow-500 fill-current" size={16} />
											<span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Par défaut</span>
										{/if}
									</div>

									{#if material.description}
										<p class="text-sm text-gray-600 mb-3">{material.description}</p>
									{/if}

									<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
										{#if material.edition}
											<div>
												<span class="font-medium text-gray-700">Édition :</span>
												<p class="text-gray-600">{material.edition}</p>
											</div>
										{/if}
										{#if material.editor}
											<div>
												<span class="font-medium text-gray-700">Éditeur :</span>
												<p class="text-gray-600">{material.editor}</p>
											</div>
										{/if}
										<div>
											<span class="font-medium text-gray-700">Créé le :</span>
											<p class="text-gray-600">{formatDate(material.createdAt)}</p>
										</div>
										<div>
											<span class="font-medium text-gray-700">Fichiers :</span>
											<p class="text-gray-600 font-semibold {material.files_count > 0 ? 'text-green-600' : 'text-orange-600'}">
												{material.files_count || 0}
												{#if material.files_count > 0}
													<span class="text-xs text-green-500">✓</span>
												{:else}
													<span class="text-xs text-orange-500">⚠</span>
												{/if}
											</p>
										</div>
									</div>

									{#if material.notes}
										<div class="mt-3 p-2 bg-blue-50 rounded text-sm">
											<span class="font-medium text-blue-800">Notes :</span>
											<span class="text-blue-700">{material.notes}</span>
										</div>
									{/if}
								</div>

								<div class="flex items-center gap-2 ml-4">
									<button
										class="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
										on:click={() => deleteMaterial(material)}
										title="Supprimer"
									>
										<Trash2 size={18} />
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Modal de création -->
{#if showCreateForm}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
			<div class="p-6">
				<h3 class="text-xl font-bold text-gray-800 mb-4">
					Nouveau matériel pour "{selectedPiece?.name}"
				</h3>

				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Nom du matériel *
						</label>
						<input
							type="text"
							bind:value={newMaterialData.name}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent"
							placeholder="Ex: Matériel principal, Version concert"
							required
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Description
						</label>
						<textarea
							bind:value={newMaterialData.description}
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent resize-vertical"
							placeholder="Description du matériel..."
						></textarea>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Édition
							</label>
							<input
								type="text"
								bind:value={newMaterialData.edition}
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent"
								placeholder="Ex: Urtext, Peters"
							/>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Éditeur
							</label>
							<input
								type="text"
								bind:value={newMaterialData.editor}
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent"
								placeholder="Maison d'édition"
							/>
						</div>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Notes
						</label>
						<textarea
							bind:value={newMaterialData.notes}
							rows="3"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent resize-vertical"
							placeholder="Coups d'archets, modifications..."
						></textarea>
					</div>

					<label class="flex items-center">
						<input
							type="checkbox"
							bind:checked={newMaterialData.is_default}
							class="w-4 h-4 text-[#6B9AD9] bg-gray-100 border-gray-300 rounded focus:ring-[#6B9AD9] focus:ring-2"
						/>
						<span class="ml-2 text-sm text-gray-700">
							Définir comme matériel par défaut pour cette pièce
						</span>
					</label>
				</div>

				<div class="flex items-center justify-end gap-3 mt-6">
					<button
						type="button"
						class="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
						on:click={() => showCreateForm = false}
					>
						Annuler
					</button>
					<button
						type="button"
						class="px-6 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors"
						on:click={createMaterial}
						disabled={!newMaterialData.name.trim()}
					>
						Créer
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}