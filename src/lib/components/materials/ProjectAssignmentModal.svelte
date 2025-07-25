<!-- src/lib/components/materials/ProjectAssignmentModal.svelte -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { X, FolderOpen, Search, Check } from 'lucide-svelte';
	import type { Material } from '$lib/types';

	const dispatch = createEventDispatcher();

	export let material: Material;
	export let projects: any[] = [];

	let searchQuery = '';
	let selectedProjectIds = new Set<number>();
	let isSubmitting = false;

	// Filtrer les projets disponibles
	$: availableProjects = projects.filter(project => {
		// Vérifier si ce projet contient déjà la pièce de ce matériel
		const hasPiece = project.pieces?.some(piece => piece.id === material.piece_id);

		if (!hasPiece) return false;

		// Appliquer le filtre de recherche
		if (searchQuery) {
			return project.name.toLowerCase().includes(searchQuery.toLowerCase());
		}

		return true;
	});

	function toggleProject(projectId: number) {
		if (selectedProjectIds.has(projectId)) {
			selectedProjectIds.delete(projectId);
		} else {
			selectedProjectIds.add(projectId);
		}
		selectedProjectIds = new Set(selectedProjectIds);
	}

	async function handleAssign() {
		if (selectedProjectIds.size === 0 || isSubmitting) return;

		isSubmitting = true;

		try {
			// Créer les assignations pour chaque projet sélectionné
			const assignments = Array.from(selectedProjectIds).map(projectId => ({
				projectId,
				pieceId: material.piece_id,
				materialId: material.id
			}));

			const response = await fetch('/api/materials/assign-bulk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ assignments })
			});

			if (response.ok) {
				dispatch('assigned');
			} else {
				const error = await response.json();
				alert('Erreur lors de l\'assignation: ' + (error.message || 'Erreur inconnue'));
			}
		} catch (error) {
			console.error('Error assigning material:', error);
			alert('Erreur lors de l\'assignation du matériel');
		}

		isSubmitting = false;
	}

	function handleCancel() {
		dispatch('close');
	}
</script>

<!-- Modal d'assignation -->
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
	<div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
		<!-- En-tête -->
		<div class="flex items-center justify-between p-6 border-b border-gray-200">
			<div>
				<h3 class="text-xl font-bold text-gray-800">Assigner le matériel à des projets</h3>
				<p class="text-sm text-gray-600 mt-1">
					Matériel: <strong>{material.name}</strong>
				</p>
			</div>
			<button
				class="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
				on:click={handleCancel}
				disabled={isSubmitting}
			>
				<X size={20} />
			</button>
		</div>

		<!-- Recherche -->
		<div class="p-4 border-b border-gray-200">
			<div class="relative">
				<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
				<input
					type="text"
					placeholder="Rechercher un projet..."
					bind:value={searchQuery}
					class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent"
					disabled={isSubmitting}
				/>
			</div>
		</div>

		<!-- Liste des projets -->
		<div class="p-4 overflow-y-auto max-h-[50vh]">
			{#if availableProjects.length === 0}
				<div class="text-center py-8">
					<FolderOpen class="mx-auto mb-4 text-gray-400" size={48} />
					<p class="text-gray-500 mb-2">
						{projects.length === 0
							? 'Aucun projet disponible'
							: searchQuery
								? 'Aucun projet ne correspond à la recherche'
								: 'Aucun projet ne contient cette pièce'
						}
					</p>
					{#if projects.length > 0 && !searchQuery}
						<p class="text-sm text-gray-400">
							Seuls les projets contenant la pièce "{material.piece?.name || 'inconnue'}" peuvent utiliser ce matériel.
						</p>
					{/if}
				</div>
			{:else}
				<div class="space-y-2">
					{#each availableProjects as project}
						<label class="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-[#6B9AD9] cursor-pointer transition-colors {selectedProjectIds.has(project.id) ? 'bg-blue-50 border-blue-300' : ''}">
							<input
								type="checkbox"
								checked={selectedProjectIds.has(project.id)}
								on:change={() => toggleProject(project.id)}
								class="mt-1 w-4 h-4 text-[#6B9AD9] bg-gray-100 border-gray-300 rounded focus:ring-[#6B9AD9] focus:ring-2"
								disabled={isSubmitting}
							/>

							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2">
									<FolderOpen class="text-gray-600 flex-shrink-0" size={16} />
									<h4 class="font-medium text-gray-900">{project.name}</h4>
									{#if selectedProjectIds.has(project.id)}
										<Check class="text-green-600 flex-shrink-0" size={16} />
									{/if}
								</div>

								<div class="text-sm text-gray-600 mt-1">
									{project.pieces?.length || 0} pièce{project.pieces?.length !== 1 ? 's' : ''}
									{#if project.pieces?.some(p => p.id === material.piece_id)}
										• Contient la pièce requise
									{/if}
								</div>

								{#if project.description}
									<p class="text-xs text-gray-500 mt-1 line-clamp-2">
										{project.description}
									</p>
								{/if}
							</div>
						</label>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Pied de page -->
		<div class="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
			<div class="text-sm text-gray-600">
				{selectedProjectIds.size} projet{selectedProjectIds.size !== 1 ? 's' : ''} sélectionné{selectedProjectIds.size !== 1 ? 's' : ''}
			</div>

			<div class="flex gap-3">
				<button
					type="button"
					class="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
					on:click={handleCancel}
					disabled={isSubmitting}
				>
					Annuler
				</button>
				<button
					type="button"
					class="flex items-center gap-2 px-6 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					on:click={handleAssign}
					disabled={selectedProjectIds.size === 0 || isSubmitting}
				>
					{#if isSubmitting}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
					{/if}
					Assigner {selectedProjectIds.size > 0 ? `(${selectedProjectIds.size})` : ''}
				</button>
			</div>
		</div>
	</div>
</div>

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>