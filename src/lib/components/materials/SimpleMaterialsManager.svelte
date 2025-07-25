<!-- src/lib/components/materials/SimpleMaterialsManager.svelte -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import {
		Package,
		Plus,
		Music,
		FileText,
		Eye,
		Edit3,
		Trash2,
		Upload,
		Users,
		Star
	} from 'lucide-svelte';

	const dispatch = createEventDispatcher();

	let materials: any[] = [];
	let pieces: any[] = [];
	let isLoading = true;
	let showCreateForm = false;
	let newMaterialData = {
		name: '',
		description: '',
		piece_id: null,
		is_default: false
	};

	onMount(async () => {
		await Promise.all([
			loadAllMaterials(),
			loadPieces()
		]);
		isLoading = false;
	});

	async function loadAllMaterials() {
		try {
			// Puisque la route /api/materials n'existe pas, on charge depuis les pièces
			await loadMaterialsFromPieces();
		} catch (error) {
			console.error('Error loading materials:', error);
		}
	}

	async function loadMaterialsFromPieces() {
		try {
			// Charger d'abord les pièces avec votre API existante
			const piecesResponse = await fetch('/api/pieces?limit=1000&page=1&filter=&orderBy=name&order=asc');
			if (piecesResponse.ok) {
				const piecesData = await piecesResponse.json();
				const allPieces = piecesData.data || piecesData || [];

				// Pour chaque pièce, charger ses matériels
				const allMaterials = [];
				for (const piece of allPieces) {
					try {
						const materialsResponse = await fetch(`/api/materials/piece/${piece.id}`);
						if (materialsResponse.ok) {
							const pieceMaterials = await materialsResponse.json();
							// Ajouter les informations de la pièce à chaque matériel
							pieceMaterials.forEach(material => {
								material.piece = piece;
								allMaterials.push(material);
							});
						}
					} catch (error) {
						console.error(`Error loading materials for piece ${piece.id}:`, error);
					}
				}
				materials = allMaterials;
				console.log('✅ Loaded materials from pieces:', materials.length);
			}
		} catch (error) {
			console.error('Error in material loading from pieces:', error);
		}
	}

	async function loadPieces() {
		try {
			// Utiliser votre API existante
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

	async function createMaterial() {
		if (!newMaterialData.name.trim() || !newMaterialData.piece_id) {
			alert('Veuillez remplir tous les champs obligatoires');
			return;
		}

		try {
			const response = await fetch('/api/materials', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(newMaterialData)
			});

			if (response.ok) {
				await loadAllMaterials();
				showCreateForm = false;
				newMaterialData = { name: '', description: '', piece_id: null, is_default: false };
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
				await loadAllMaterials();
				dispatch('materialsUpdated');
			} else {
				alert('Erreur lors de la suppression');
			}
		} catch (error) {
			console.error('Error deleting material:', error);
			alert('Erreur lors de la suppression du matériel');
		}
	}

	function getPieceName(material: any): string {
		if (material.piece) {
			return `${material.piece.name} - ${material.piece.composer?.shortName || ''}`;
		}

		const piece = pieces.find(p => p.id === material.piece_id);
		return piece ? `${piece.name} - ${piece.composer?.shortName || ''}` : 'Pièce inconnue';
	}

	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	// Statistiques calculées
	$: totalMaterials = materials.length;
	$: totalFiles = materials.reduce((sum, material) => sum + (material.files_count || 0), 0);
	$: totalProjects = materials.reduce((sum, material) => sum + (material.projects_count || 0), 0);
</script>

<div class="space-y-6">
	<!-- En-tête avec statistiques -->
	<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
		<div class="flex items-center justify-between mb-6">
			<div>
				<h2 class="text-2xl font-bold text-gray-700 uppercase">Gestion globale des matériels</h2>
				<p class="text-gray-500 mt-1">Vue d'ensemble de tous les matériels créés</p>
			</div>

			<button
				class="flex items-center gap-2 px-6 py-3 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors font-semibold"
				on:click={() => showCreateForm = true}
			>
				<Plus size={20} />
				Nouveau matériel
			</button>
		</div>

		<!-- Statistiques -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
			<div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
				<div class="flex items-center gap-3">
					<Package class="text-blue-600" size={24} />
					<div>
						<div class="text-2xl font-bold text-blue-800">{totalMaterials}</div>
						<div class="text-sm text-blue-600">Matériels totaux</div>
					</div>
				</div>
			</div>

			<div class="p-4 bg-green-50 rounded-lg border border-green-200">
				<div class="flex items-center gap-3">
					<FileText class="text-green-600" size={24} />
					<div>
						<div class="text-2xl font-bold text-green-800">{totalFiles}</div>
						<div class="text-sm text-green-600">Fichiers totaux</div>
					</div>
				</div>
			</div>

			<div class="p-4 bg-purple-50 rounded-lg border border-purple-200">
				<div class="flex items-center gap-3">
					<Users class="text-purple-600" size={24} />
					<div>
						<div class="text-2xl font-bold text-purple-800">{totalProjects}</div>
						<div class="text-sm text-purple-600">Assignations</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Liste des matériels -->
	<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
		{#if isLoading}
			<div class="flex justify-center items-center h-32">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B9AD9]"></div>
			</div>
		{:else if materials.length === 0}
			<div class="text-center py-8">
				<Package class="mx-auto mb-4 text-gray-400" size={48} />
				<p class="text-gray-500 mb-4">Aucun matériel créé</p>
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
					<div class="border border-gray-200 rounded-lg p-4 hover:border-[#6B9AD9] transition-all duration-200 {material.is_default ? 'ring-1 ring-yellow-400 ring-opacity-50' : ''}">
						<div class="flex items-start justify-between">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-2">
									<h3 class="text-lg font-semibold text-gray-800">{material.name}</h3>
									{#if material.is_default}
										<Star class="text-yellow-500 fill-current" size={16} />
									{/if}
									<span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
										{getPieceName(material)}
									</span>
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
										<p class="text-gray-600">{material.files_count || 0}</p>
									</div>
								</div>
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
</div>

<!-- Modal de création simplifié -->
{#if showCreateForm}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-2xl w-full max-w-md">
			<div class="p-6">
				<h3 class="text-xl font-bold text-gray-800 mb-4">Nouveau matériel</h3>

				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Pièce *
						</label>
						<select
							bind:value={newMaterialData.piece_id}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent"
							required
						>
							<option value={null}>Sélectionnez une pièce</option>
							{#each pieces as piece}
								<option value={piece.id}>
									{piece.name} - {piece.composer?.shortName || piece.composer?.longName}
								</option>
							{/each}
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Nom du matériel *
						</label>
						<input
							type="text"
							bind:value={newMaterialData.name}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent"
							placeholder="Ex: Matériel principal"
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

					<label class="flex items-center">
						<input
							type="checkbox"
							bind:checked={newMaterialData.is_default}
							class="w-4 h-4 text-[#6B9AD9] bg-gray-100 border-gray-300 rounded focus:ring-[#6B9AD9] focus:ring-2"
						/>
						<span class="ml-2 text-sm text-gray-700">
							Définir comme matériel par défaut
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
						disabled={!newMaterialData.name.trim() || !newMaterialData.piece_id}
					>
						Créer
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}