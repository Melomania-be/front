<!-- src/lib/components/materials/GlobalMaterialsManager.svelte -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import {
		Package,
		Plus,
		Search,
		Filter,
		Music,
		FileText,
		Eye,
		Edit3,
		Trash2,
		Upload,
		Users,
		ChevronRight,
		Star,
		FolderOpen
	} from 'lucide-svelte';
	import type { Material, Piece } from '$lib/types';
	import MaterialEditor from './MaterialEditor.svelte';
	import MaterialDetailView from './MaterialDetailView.svelte';

	const dispatch = createEventDispatcher();

	let materials: Material[] = [];
	let pieces: Piece[] = [];
	let projects: any[] = [];
	let selectedMaterial: Material | null = null;
	let showEditor = false;
	let showDetailView = false;
	let isLoading = true;
	let searchQuery = '';
	let filterPiece = '';
	let editMode: 'create' | 'edit' | 'duplicate' = 'create';

	// États pour les statistiques
	let totalMaterials = 0;
	let totalFiles = 0;
	let totalProjects = 0;

	onMount(async () => {
		await Promise.all([
			loadAllMaterials(),
			loadPieces(),
			loadProjects()
		]);
		isLoading = false;
	});

	async function loadAllMaterials() {
		try {
			const response = await fetch('/api/materials');
			if (response.ok) {
				materials = await response.json();
				updateStatistics();
			}
		} catch (error) {
			console.error('Error loading materials:', error);
		}
	}

	async function loadPieces() {
		try {
			const response = await fetch('/api/pieces');
			if (response.ok) {
				pieces = await response.json();
			}
		} catch (error) {
			console.error('Error loading pieces:', error);
		}
	}

	async function loadProjects() {
		try {
			const response = await fetch('/api/projects?limit=1000&page=1');
			if (response.ok) {
				const data = await response.json();
				projects = data.data || data || [];
			}
		} catch (error) {
			console.error('Error loading projects:', error);
		}
	}

	function updateStatistics() {
		totalMaterials = materials.length;
		totalFiles = materials.reduce((sum, material) => sum + (material.files_count || 0), 0);
		totalProjects = materials.reduce((sum, material) => sum + (material.projects_count || 0), 0);
	}

	// Filtrage et recherche
	$: filteredMaterials = materials.filter(material => {
		const matchesSearch = !searchQuery ||
			material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			material.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			material.piece?.name?.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesPiece = !filterPiece || material.piece_id.toString() === filterPiece;

		return matchesSearch && matchesPiece;
	});

	function openEditor(mode: 'create' | 'edit' | 'duplicate', material: Material | null = null) {
		editMode = mode;
		selectedMaterial = material;
		showEditor = true;
	}

	function openDetailView(material: Material) {
		selectedMaterial = material;
		showDetailView = true;
	}

	async function handleMaterialSaved() {
		await loadAllMaterials();
		showEditor = false;
		selectedMaterial = null;
		dispatch('materialsUpdated');
	}

	async function deleteMaterial(material: Material) {
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
				const error = await response.json();
				alert(error.message || 'Erreur lors de la suppression');
			}
		} catch (error) {
			console.error('Error deleting material:', error);
			alert('Erreur lors de la suppression du matériel');
		}
	}

	function getPieceName(pieceId: number): string {
		const piece = pieces.find(p => p.id === pieceId);
		return piece ? `${piece.name} - ${piece.composer?.shortName || ''}` : 'Pièce inconnue';
	}

	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}
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
				on:click={() => openEditor('create')}
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

		<!-- Filtres et recherche -->
		<div class="flex flex-col md:flex-row gap-4 mb-6">
			<div class="flex-1">
				<div class="relative">
					<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
					<input
						type="text"
						placeholder="Rechercher un matériel..."
						bind:value={searchQuery}
						class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent"
					/>
				</div>
			</div>

			<div class="md:w-64">
				<select
					bind:value={filterPiece}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent"
				>
					<option value="">Toutes les pièces</option>
					{#each pieces as piece}
						<option value={piece.id.toString()}>
							{piece.name} - {piece.composer?.shortName || ''}
						</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<!-- Liste des matériels -->
	<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
		{#if isLoading}
			<div class="flex justify-center items-center h-32">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B9AD9]"></div>
			</div>
		{:else if filteredMaterials.length === 0}
			<div class="text-center py-8">
				<Package class="mx-auto mb-4 text-gray-400" size={48} />
				<p class="text-gray-500 mb-4">
					{materials.length === 0 ? 'Aucun matériel créé' : 'Aucun matériel ne correspond aux filtres'}
				</p>
				{#if materials.length === 0}
					<button
						class="text-[#6B9AD9] hover:underline"
						on:click={() => openEditor('create')}
					>
						Créer le premier matériel
					</button>
				{/if}
			</div>
		{:else}
			<div class="space-y-4">
				{#each filteredMaterials as material}
					<div class="border border-gray-200 rounded-lg p-4 hover:border-[#6B9AD9] transition-all duration-200 {material.is_default ? 'ring-1 ring-yellow-400 ring-opacity-50' : ''}">
						<div class="flex items-start justify-between">
							<div class="flex-1 min-w-0">
								<!-- En-tête du matériel -->
								<div class="flex items-center gap-2 mb-2">
									<h3 class="text-lg font-semibold text-gray-800">{material.name}</h3>
									{#if material.is_default}
										<Star class="text-yellow-500 fill-current" size={16} />
									{/if}
									<span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
										{getPieceName(material.piece_id)}
									</span>
								</div>

								{#if material.description}
									<p class="text-sm text-gray-600 mb-3">{material.description}</p>
								{/if}

								<!-- Détails en grille -->
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
										<span class="font-medium text-gray-700">Modifié le :</span>
										<p class="text-gray-600">{formatDate(material.updatedAt)}</p>
									</div>
								</div>

								<!-- Statistiques du matériel -->
								<div class="flex items-center gap-6 mt-3">
									<div class="flex items-center gap-1 text-sm">
										<FileText class="text-green-600" size={16} />
										<span class="font-medium text-green-700">{material.files_count || 0}</span>
										<span class="text-gray-600">fichier{material.files_count !== 1 ? 's' : ''}</span>
									</div>
									<div class="flex items-center gap-1 text-sm">
										<FolderOpen class="text-blue-600" size={16} />
										<span class="font-medium text-blue-700">{material.projects_count || 0}</span>
										<span class="text-gray-600">projet{material.projects_count !== 1 ? 's' : ''}</span>
									</div>
								</div>
							</div>

							<!-- Actions -->
							<div class="flex items-center gap-2 ml-4">
								<button
									class="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
									on:click={() => openDetailView(material)}
									title="Voir les détails"
								>
									<Eye size={18} />
								</button>

								<button
									class="p-2 text-gray-600 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
									on:click={() => openEditor('edit', material)}
									title="Modifier"
								>
									<Edit3 size={18} />
								</button>

								<button
									class="p-2 text-gray-600 hover:text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors"
									on:click={() => openEditor('duplicate', material)}
									title="Dupliquer"
								>
									<Package size={18} />
								</button>

								<button
									class="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
									on:click={() => deleteMaterial(material)}
									title="Supprimer"
								>
									<Trash2 size={18} />
								</button>

								<button
									class="flex items-center gap-1 px-3 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors text-sm font-medium"
									on:click={() => openDetailView(material)}
								>
									Gérer
									<ChevronRight size={14} />
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Modal d'édition -->
{#if showEditor && (editMode === 'create' || selectedMaterial)}
	<MaterialEditor
		piece={editMode === 'create' ? null : pieces.find(p => p.id === selectedMaterial?.piece_id)}
		{editMode}
		material={selectedMaterial}
		{pieces}
		on:saved={handleMaterialSaved}
		on:cancelled={() => {
			showEditor = false;
			selectedMaterial = null;
		}}
	/>
{/if}

<!-- Vue détaillée -->
{#if showDetailView && selectedMaterial}
	<MaterialDetailView
		material={selectedMaterial}
		{projects}
		{pieces}
		on:close={() => {
			showDetailView = false;
			selectedMaterial = null;
		}}
		on:materialsUpdated={() => {
			loadAllMaterials();
			dispatch('materialsUpdated');
		}}
	/>
{/if}