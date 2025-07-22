<!-- src/lib/components/materials/MaterialManager.svelte -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { Plus, Edit3, Trash2, Copy, Star, Upload, Download, FileText, Eye } from 'lucide-svelte';
	import type { Material, Piece } from '$lib/types';
	import MaterialEditor from './MaterialEditor.svelte';
	import FileUploader from '../filesystem/FileUploader.svelte';

	const dispatch = createEventDispatcher();

	export let piece: Piece;
	export let projectId: number | null = null;
	export let canEdit = true;

	let materials: Material[] = [];
	let selectedMaterial: Material | null = null;
	let showEditor = false;
	let showUploader = false;
	let isLoading = true;
	let editMode: 'create' | 'edit' | 'duplicate' = 'create';

	onMount(async () => {
		await loadMaterials();
		isLoading = false;
	});

	async function loadMaterials() {
		try {
			const response = await fetch(`/api/materials/piece/${piece.id}`);
			if (response.ok) {
				materials = await response.json();
			}
		} catch (error) {
			console.error('Error loading materials:', error);
		}
	}

	function openEditor(mode: 'create' | 'edit' | 'duplicate', material: Material | null = null) {
		editMode = mode;
		selectedMaterial = material;
		showEditor = true;
	}

	async function handleMaterialSaved(event: CustomEvent) {
		await loadMaterials();
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
				await loadMaterials();
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

	async function setAsDefault(material: Material) {
		try {
			const response = await fetch(`/api/materials/${material.id}/set-default`, {
				method: 'POST'
			});

			if (response.ok) {
				await loadMaterials();
				dispatch('materialsUpdated');
			}
		} catch (error) {
			console.error('Error setting default material:', error);
		}
	}

	async function assignToProject(material: Material) {
		if (!projectId) return;

		try {
			const response = await fetch(`/api/materials/assign`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					projectId,
					pieceId: piece.id,
					materialId: material.id
				})
			});

			if (response.ok) {
				dispatch('materialAssigned', material);
			}
		} catch (error) {
			console.error('Error assigning material:', error);
		}
	}

	function openUploader(material: Material) {
		selectedMaterial = material;
		showUploader = true;
	}

	async function handleFileUpload(files: FileList) {
		if (!selectedMaterial) return;

		const formData = new FormData();
		Array.from(files).forEach(file => {
			formData.append('files', file);
		});
		formData.append('materialId', selectedMaterial.id.toString());

		try {
			const response = await fetch(`/api/materials/${selectedMaterial.id}/files`, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				await loadMaterials();
				showUploader = false;
				selectedMaterial = null;
			}
		} catch (error) {
			console.error('Error uploading files:', error);
		}
	}

	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}
</script>

<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
	<!-- En-tête -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h3 class="text-xl font-bold text-gray-700 uppercase">Matériels disponibles</h3>
			<p class="text-gray-500 mt-1">
				{piece.name} - {piece.composer?.shortName || piece.composer?.longName}
			</p>
		</div>

		{#if canEdit}
			<button
				class="flex items-center gap-2 px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors"
				on:click={() => openEditor('create')}
			>
				<Plus size={16} />
				Nouveau matériel
			</button>
		{/if}
	</div>

	{#if isLoading}
		<div class="flex justify-center items-center h-32">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B9AD9]"></div>
		</div>
	{:else if materials.length === 0}
		<div class="text-center py-8">
			<FileText class="mx-auto mb-4 text-gray-400" size={48} />
			<p class="text-gray-500 mb-4">Aucun matériel créé pour cette pièce</p>
			{#if canEdit}
				<button
					class="text-[#6B9AD9] hover:underline"
					on:click={() => openEditor('create')}
				>
					Créer le premier matériel
				</button>
			{/if}
		</div>
	{:else}
		<!-- Liste des matériels -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each materials as material}
				<div class="border-2 border-gray-200 rounded-lg p-4 hover:border-[#6B9AD9] transition-all duration-200 {material.is_default ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}">
					<!-- En-tête du matériel -->
					<div class="flex items-start justify-between mb-3">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1">
								<h4 class="font-semibold text-gray-800 truncate">{material.name}</h4>
								{#if material.is_default}
									<Star class="text-yellow-500 fill-current" size={16} />
								{/if}
							</div>
							{#if material.description}
								<p class="text-sm text-gray-600 line-clamp-2">{material.description}</p>
							{/if}
						</div>
					</div>

					<!-- Détails -->
					<div class="space-y-2 mb-4">
						{#if material.edition}
							<div class="text-sm">
								<span class="font-medium text-gray-700">Édition :</span>
								<span class="text-gray-600">{material.edition}</span>
							</div>
						{/if}
						{#if material.editor}
							<div class="text-sm">
								<span class="font-medium text-gray-700">Éditeur :</span>
								<span class="text-gray-600">{material.editor}</span>
							</div>
						{/if}

						<div class="flex items-center justify-between text-sm text-gray-500">
							<span>{material.files_count || 0} fichier{material.files_count !== 1 ? 's' : ''}</span>
							<span>{formatDate(material.createdAt)}</span>
						</div>
					</div>

					<!-- Actions -->
					<div class="flex items-center gap-2">
						{#if projectId}
							<button
								class="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
								on:click={() => assignToProject(material)}
							>
								Utiliser
							</button>
						{/if}

						{#if canEdit}
							<button
								class="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
								on:click={() => openUploader(material)}
								title="Ajouter des fichiers"
							>
								<Upload size={16} />
							</button>

							<button
								class="p-2 text-gray-600 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
								on:click={() => openEditor('edit', material)}
								title="Modifier"
							>
								<Edit3 size={16} />
							</button>

							<button
								class="p-2 text-gray-600 hover:text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors"
								on:click={() => openEditor('duplicate', material)}
								title="Dupliquer"
							>
								<Copy size={16} />
							</button>

							{#if !material.is_default}
								<button
									class="p-2 text-gray-600 hover:text-yellow-600 rounded-lg hover:bg-yellow-50 transition-colors"
									on:click={() => setAsDefault(material)}
									title="Définir par défaut"
								>
									<Star size={16} />
								</button>
							{/if}

							<button
								class="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
								on:click={() => deleteMaterial(material)}
								title="Supprimer"
							>
								<Trash2 size={16} />
							</button>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Modal d'édition -->
{#if showEditor}
	<MaterialEditor
		{piece}
		{editMode}
		material={selectedMaterial}
		on:saved={handleMaterialSaved}
		on:cancelled={() => {
			showEditor = false;
			selectedMaterial = null;
		}}
	/>
{/if}

<!-- Modal d'upload -->
{#if showUploader && selectedMaterial}
	<FileUploader
		on:upload={(e) => handleFileUpload(e.detail)}
		on:cancel={() => {
			showUploader = false;
			selectedMaterial = null;
		}}
	/>
{/if}

<style>
    .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
</style>