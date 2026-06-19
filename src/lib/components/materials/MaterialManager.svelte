<!-- src/lib/components/materials/MaterialManager.svelte - Version avec upload TRÈS VISIBLE -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import {
		Plus,
		Edit3,
		Trash2,
		Copy,
		Star,
		Upload,
		Download,
		FileText,
		Eye,
		BarChart3,
		Users,
		FolderOpen,
		CloudUpload
	} from 'lucide-svelte';
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

	// ✅ FONCTION UPLOAD TRÈS VISIBLE
	function openUploader(material: Material) {
		selectedMaterial = material;
		showUploader = true;
		console.log('📤 Opening uploader for material:', material.name);
	}

	async function handleFileUpload(files: FileList) {
		if (!selectedMaterial) return;

		console.log('📤 Uploading files to material:', selectedMaterial.name);
		console.log(
			'📂 Files to upload:',
			Array.from(files).map((f) => f.name)
		);

		const formData = new FormData();
		Array.from(files).forEach((file) => {
			formData.append('files', file);
		});

		try {
			const response = await fetch(`/api/materials/${selectedMaterial.id}/files`, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				console.log('✅ Upload successful!');
				await loadMaterials();
				showUploader = false;
				selectedMaterial = null;
			} else {
				console.error('❌ Upload failed:', response.status);
				const error = await response.json();
				alert("Erreur lors de l'upload: " + (error.message || 'Erreur inconnue'));
			}
		} catch (error) {
			console.error('❌ Upload error:', error);
			alert("Erreur lors de l'upload des fichiers");
		}
	}

	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	// Calculer les statistiques
	$: totalFiles = materials.reduce((sum, material) => sum + (material.files_count || 0), 0);
	$: totalProjects = materials.reduce((sum, material) => sum + (material.projects_count || 0), 0);
	$: defaultMaterial = materials.find((m) => m.is_default);
</script>

<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
	<!-- En-tête avec statistiques -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h3 class="text-xl font-bold text-gray-700 uppercase">Matériels disponibles</h3>
			<p class="text-gray-500 mt-1">
				{piece.name} - {piece.composer?.shortName || piece.composer?.longName}
			</p>

			<!-- Statistiques en temps réel -->
			{#if materials.length > 0}
				<div class="flex items-center gap-6 mt-3 text-sm">
					<div class="flex items-center gap-2 text-blue-600">
						<FolderOpen size={16} />
						<span>{materials.length} matériel{materials.length !== 1 ? 's' : ''}</span>
					</div>
					<div class="flex items-center gap-2 text-green-600">
						<FileText size={16} />
						<span>{totalFiles} fichier{totalFiles !== 1 ? 's' : ''}</span>
					</div>
					<div class="flex items-center gap-2 text-purple-600">
						<Users size={16} />
						<span>{totalProjects} projet{totalProjects !== 1 ? 's' : ''}</span>
					</div>
					{#if defaultMaterial}
						<div class="flex items-center gap-2 text-yellow-600">
							<Star size={16} />
							<span>Défaut: {defaultMaterial.name}</span>
						</div>
					{/if}
				</div>
			{/if}
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
				<button class="text-[#6B9AD9] hover:underline" on:click={() => openEditor('create')}>
					Créer le premier matériel
				</button>
			{/if}
		</div>
	{:else}
		<!-- Liste des matériels avec upload TRÈS VISIBLE -->
		<div class="space-y-6">
			{#each materials as material}
				<div
					class="border-2 border-gray-200 rounded-lg p-6 hover:border-[#6B9AD9] transition-all duration-200 {material.is_default
						? 'ring-2 ring-yellow-400 ring-opacity-50'
						: ''}"
				>
					<!-- En-tête du matériel -->
					<div class="flex items-start justify-between mb-4">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-2">
								<h4 class="text-lg font-semibold text-gray-800">{material.name}</h4>
								{#if material.is_default}
									<Star class="text-yellow-500 fill-current" size={20} />
								{/if}
							</div>
							{#if material.description}
								<p class="text-sm text-gray-600 mb-2">{material.description}</p>
							{/if}
						</div>
					</div>

					<!-- Détails et statistiques -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
						<div class="space-y-2">
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
							<div class="text-sm text-gray-500">
								Créé le {formatDate(material.createdAt)}
							</div>
						</div>

						<div class="flex items-center justify-end gap-4">
							<div class="text-center">
								<div class="text-2xl font-bold text-green-600">{material.files_count || 0}</div>
								<div class="text-xs text-gray-500">Fichiers</div>
							</div>
							<div class="text-center">
								<div class="text-2xl font-bold text-blue-600">{material.projects_count || 0}</div>
								<div class="text-xs text-gray-500">Projets</div>
							</div>
						</div>
					</div>

					<!-- ✅ SECTION UPLOAD TRÈS VISIBLE -->
					<div class="border-t pt-4">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-4">
								<h5 class="font-medium text-gray-700">Fichiers de ce matériel :</h5>
								{#if material.files_count > 0}
									<span class="text-sm text-green-600"
										>{material.files_count} fichier{material.files_count !== 1 ? 's' : ''} disponible{material.files_count !==
										1
											? 's'
											: ''}</span
									>
								{:else}
									<span class="text-sm text-orange-600">Aucun fichier ajouté</span>
								{/if}
							</div>

							{#if canEdit}
								<!-- ✅ BOUTON UPLOAD PRINCIPAL TRÈS VISIBLE -->
								<button
									class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
									on:click={() => openUploader(material)}
								>
									<CloudUpload size={20} />
									<span class="font-semibold">Ajouter des fichiers</span>
								</button>
							{/if}
						</div>

						<!-- Actions secondaires -->
						{#if canEdit}
							<div class="flex items-center gap-2 mt-4">
								{#if projectId}
									<button
										class="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
										on:click={() => assignToProject(material)}
									>
										Utiliser dans le projet
									</button>
								{/if}

								<button
									class="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-green-600 border border-gray-300 rounded-lg hover:border-green-300 transition-colors text-sm"
									on:click={() => openEditor('edit', material)}
								>
									<Edit3 size={14} />
									Modifier
								</button>

								<button
									class="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-yellow-600 border border-gray-300 rounded-lg hover:border-yellow-300 transition-colors text-sm"
									on:click={() => openEditor('duplicate', material)}
								>
									<Copy size={14} />
									Dupliquer
								</button>

								{#if !material.is_default}
									<button
										class="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-yellow-600 border border-gray-300 rounded-lg hover:border-yellow-300 transition-colors text-sm"
										on:click={() => setAsDefault(material)}
									>
										<Star size={14} />
										Par défaut
									</button>
								{/if}

								<button
									class="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-red-600 border border-gray-300 rounded-lg hover:border-red-300 transition-colors text-sm"
									on:click={() => deleteMaterial(material)}
								>
									<Trash2 size={14} />
									Supprimer
								</button>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<!-- Résumé global -->
		{#if materials.length > 1}
			<div class="mt-6 p-4 bg-gray-50 rounded-lg">
				<div class="flex items-center justify-between">
					<div>
						<h4 class="font-semibold text-gray-700 mb-1">Résumé pour "{piece.name}"</h4>
						<p class="text-sm text-gray-600">
							{materials.length} matériels • {totalFiles} fichiers • Utilisé dans {totalProjects} projet{totalProjects !==
							1
								? 's'
								: ''}
						</p>
					</div>
					<div class="flex items-center gap-2">
						<BarChart3 class="text-blue-500" size={20} />
					</div>
				</div>
			</div>
		{/if}
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

<!-- ✅ Modal d'upload avec titre explicite -->
{#if showUploader && selectedMaterial}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
			<!-- En-tête avec info sur le matériel -->
			<div class="flex items-center justify-between p-6 border-b border-gray-200 bg-blue-50">
				<div>
					<h3 class="text-xl font-bold text-gray-800">Ajouter des fichiers</h3>
					<p class="text-sm text-gray-600 mt-1">
						Au matériel: <strong>{selectedMaterial.name}</strong>
					</p>
					<p class="text-xs text-gray-500">
						Pièce: {piece.name} • {piece.composer?.shortName || piece.composer?.longName}
					</p>
				</div>
				<button
					class="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
					on:click={() => {
						showUploader = false;
						selectedMaterial = null;
					}}
				>
					<Edit3 size={20} />
				</button>
			</div>

			<!-- Composant upload -->
			<div class="p-6">
				<FileUploader
					on:upload={(e) => handleFileUpload(e.detail)}
					on:cancel={() => {
						showUploader = false;
						selectedMaterial = null;
					}}
				/>
			</div>
		</div>
	</div>
{/if}

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
