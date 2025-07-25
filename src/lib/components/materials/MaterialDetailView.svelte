<!-- src/lib/components/materials/MaterialDetailView.svelte -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import {
		X,
		FileText,
		Eye,
		Download,
		Trash2,
		Upload,
		Plus,
		Users,
		FolderOpen,
		Star,
		Package,
		CloudUpload,
		Edit3
	} from 'lucide-svelte';
	import type { Material } from '$lib/types';
	import FileUploader from '../filesystem/FileUploader.svelte';
	import FilePreview from '../filesystem/FilePreview.svelte';
	import ProjectAssignmentModal from './ProjectAssignmentModal.svelte';

	const dispatch = createEventDispatcher();

	export let material: Material;
	export let projects: any[] = [];
	export let pieces: any[] = [];

	let materialFiles: any[] = [];
	let assignedProjects: any[] = [];
	let isLoadingFiles = true;
	let isLoadingProjects = true;
	let showUploader = false;
	let showPreview = false;
	let showAssignmentModal = false;
	let currentPreviewFile: any = null;

	onMount(async () => {
		await Promise.all([
			loadMaterialFiles(),
			loadAssignedProjects()
		]);
	});

	async function loadMaterialFiles() {
		try {
			const response = await fetch(`/api/materials/${material.id}/files`);
			if (response.ok) {
				materialFiles = await response.json();
			}
		} catch (error) {
			console.error('Error loading material files:', error);
		}
		isLoadingFiles = false;
	}

	async function loadAssignedProjects() {
		try {
			const response = await fetch(`/api/materials/${material.id}/projects`);
			if (response.ok) {
				assignedProjects = await response.json();
			}
		} catch (error) {
			console.error('Error loading assigned projects:', error);
		}
		isLoadingProjects = false;
	}

	async function handleFileUpload(files: FileList) {
		const formData = new FormData();
		Array.from(files).forEach(file => {
			formData.append('files', file);
		});

		try {
			const response = await fetch(`/api/materials/${material.id}/files`, {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (response.ok && result.success) {
				await loadMaterialFiles();
				showUploader = false;
				dispatch('materialsUpdated');
			} else {
				alert('Erreur lors de l\'upload: ' + (result.error || 'Erreur inconnue'));
			}
		} catch (error) {
			console.error('Upload error:', error);
			alert('Erreur lors de l\'upload des fichiers');
		}
	}

	async function deleteFile(fileId: number, fileName: string) {
		if (!confirm(`Êtes-vous sûr de vouloir supprimer "${fileName}" ?`)) {
			return;
		}

		try {
			const response = await fetch(`/api/filesystem/files/${fileId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadMaterialFiles();
				dispatch('materialsUpdated');
			} else {
				alert('Erreur lors de la suppression');
			}
		} catch (error) {
			console.error('Error deleting file:', error);
			alert('Erreur lors de la suppression du fichier');
		}
	}

	async function downloadFile(fileId: number, fileName: string) {
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
			console.error('Error downloading file:', error);
			alert('Erreur lors du téléchargement');
		}
	}

	function openFilePreview(file: any) {
		currentPreviewFile = file;
		showPreview = true;
	}

	function formatFileSize(bytes: number): string {
		if (!bytes || bytes === 0) return '';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	function getFileIcon(fileName: string) {
		const extension = fileName.split('.').pop()?.toLowerCase();
		// Retourner l'icône appropriée selon l'extension
		return FileText; // Simplifié pour cet exemple
	}

	function getPieceName(): string {
		const piece = pieces.find(p => p.id === material.piece_id);
		return piece ? `${piece.name} - ${piece.composer?.shortName || ''}` : 'Pièce inconnue';
	}

	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	async function handleProjectAssignment(event: CustomEvent) {
		await loadAssignedProjects();
		showAssignmentModal = false;
		dispatch('materialsUpdated');
	}

	async function unassignFromProject(projectId: number, projectName: string) {
		if (!confirm(`Désassigner ce matériel du projet "${projectName}" ?`)) {
			return;
		}

		try {
			const response = await fetch(`/api/materials/unassign`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					projectId,
					pieceId: material.piece_id,
					materialId: material.id
				})
			});

			if (response.ok) {
				await loadAssignedProjects();
				dispatch('materialsUpdated');
			} else {
				alert('Erreur lors de la désassignation');
			}
		} catch (error) {
			console.error('Error unassigning material:', error);
			alert('Erreur lors de la désassignation');
		}
	}
</script>

<!-- Modal de vue détaillée -->
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
	<div class="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
		<!-- En-tête -->
		<div class="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
			<div class="flex-1">
				<div class="flex items-center gap-3 mb-2">
					<h2 class="text-2xl font-bold text-gray-800">{material.name}</h2>
					{#if material.is_default}
						<Star class="text-yellow-500 fill-current" size={24} />
					{/if}
				</div>
				<p class="text-gray-600">{getPieceName()}</p>
				{#if material.description}
					<p class="text-sm text-gray-500 mt-1">{material.description}</p>
				{/if}
			</div>

			<button
				class="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-white hover:bg-opacity-70 transition-colors"
				on:click={() => dispatch('close')}
			>
				<X size={24} />
			</button>
		</div>

		<!-- Contenu principal -->
		<div class="flex-1 overflow-y-auto p-6 space-y-6 max-h-[calc(90vh-200px)]">
			<!-- Informations du matériel -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{#if material.edition}
					<div class="p-3 bg-gray-50 rounded-lg">
						<div class="text-sm font-medium text-gray-700">Édition</div>
						<div class="text-gray-900">{material.edition}</div>
					</div>
				{/if}
				{#if material.editor}
					<div class="p-3 bg-gray-50 rounded-lg">
						<div class="text-sm font-medium text-gray-700">Éditeur</div>
						<div class="text-gray-900">{material.editor}</div>
					</div>
				{/if}
				<div class="p-3 bg-gray-50 rounded-lg">
					<div class="text-sm font-medium text-gray-700">Créé le</div>
					<div class="text-gray-900">{formatDate(material.createdAt)}</div>
				</div>
				<div class="p-3 bg-gray-50 rounded-lg">
					<div class="text-sm font-medium text-gray-700">Modifié le</div>
					<div class="text-gray-900">{formatDate(material.updatedAt)}</div>
				</div>
			</div>

			{#if material.notes}
				<div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
					<h4 class="font-medium text-blue-800 mb-2">Notes</h4>
					<p class="text-blue-700 text-sm">{material.notes}</p>
				</div>
			{/if}

			<!-- Section des fichiers -->
			<div class="bg-white border border-gray-200 rounded-lg">
				<div class="flex items-center justify-between p-4 border-b border-gray-200">
					<div class="flex items-center gap-3">
						<h3 class="text-lg font-semibold text-gray-800">Fichiers du matériel</h3>
						<span class="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
							{materialFiles.length} fichier{materialFiles.length !== 1 ? 's' : ''}
						</span>
					</div>

					<button
						class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md"
						on:click={() => showUploader = true}
					>
						<CloudUpload size={18} />
						<span class="font-medium">Ajouter fichiers</span>
					</button>
				</div>

				<div class="p-4">
					{#if isLoadingFiles}
						<div class="flex justify-center items-center h-20">
							<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
						</div>
					{:else if materialFiles.length === 0}
						<div class="text-center py-8">
							<FileText class="mx-auto mb-3 text-gray-400" size={32} />
							<p class="text-gray-500 mb-3">Aucun fichier dans ce matériel</p>
							<button
								class="text-blue-600 hover:text-blue-700 font-medium"
								on:click={() => showUploader = true}
							>
								Ajouter le premier fichier
							</button>
						</div>
					{:else}
						<div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
							{#each materialFiles as file}
								<div class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors group">
									<div class="flex-shrink-0">
										<svelte:component this={getFileIcon(file.name)} size={20} class="text-gray-600" />
									</div>
									<div class="flex-1 min-w-0">
										<div class="font-medium text-gray-900 truncate" title={file.name}>
											{file.name}
										</div>
										{#if file.size}
											<div class="text-xs text-gray-500">
												{formatFileSize(file.size)}
											</div>
										{/if}
										{#if file.instrument_part}
											<div class="text-xs text-blue-600 bg-blue-50 px-1 rounded mt-1 inline-block">
												{file.instrument_part}
											</div>
										{/if}
									</div>
									<div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
										<button
											class="p-1 text-gray-600 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
											on:click={() => previewFile(file)}
											title="Prévisualiser"
										>
											<Eye size={14} />
										</button>
										<button
											class="p-1 text-gray-600 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
											on:click={() => downloadFile(file.id, file.name)}
											title="Télécharger"
										>
											<Download size={14} />
										</button>
										<button
											class="p-1 text-gray-600 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
											on:click={() => deleteFile(file.id, file.name)}
											title="Supprimer"
										>
											<Trash2 size={14} />
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Section des projets assignés -->
			<div class="bg-white border border-gray-200 rounded-lg">
				<div class="flex items-center justify-between p-4 border-b border-gray-200">
					<div class="flex items-center gap-3">
						<h3 class="text-lg font-semibold text-gray-800">Projets utilisant ce matériel</h3>
						<span class="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm font-medium">
							{assignedProjects.length} projet{assignedProjects.length !== 1 ? 's' : ''}
						</span>
					</div>

					<button
						class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
						on:click={() => showAssignmentModal = true}
					>
						<Plus size={18} />
						Assigner à un projet
					</button>
				</div>

				<div class="p-4">
					{#if isLoadingProjects}
						<div class="flex justify-center items-center h-20">
							<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
						</div>
					{:else if assignedProjects.length === 0}
						<div class="text-center py-8">
							<FolderOpen class="mx-auto mb-3 text-gray-400" size={32} />
							<p class="text-gray-500 mb-3">Ce matériel n'est assigné à aucun projet</p>
							<button
								class="text-green-600 hover:text-green-700 font-medium"
								on:click={() => showAssignmentModal = true}
							>
								Assigner à un projet
							</button>
						</div>
					{:else}
						<div class="space-y-3">
							{#each assignedProjects as project}
								<div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
									<div class="flex items-center gap-3">
										<FolderOpen class="text-purple-600" size={20} />
										<div>
											<div class="font-medium text-gray-900">{project.name}</div>
											<div class="text-sm text-gray-500">
												Assigné le {formatDate(project.assigned_at)}
											</div>
										</div>
									</div>
									<button
										class="px-3 py-1 text-red-600 hover:text-red-700 border border-red-300 rounded hover:bg-red-50 transition-colors text-sm"
										on:click={() => unassignFromProject(project.id, project.name)}
									>
										Désassigner
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Modal d'upload -->
{#if showUploader}
	<FileUploader
		on:upload={(e) => handleFileUpload(e.detail)}
		on:cancel={() => showUploader = false}
	/>
{/if}

<!-- Modal de prévisualisation -->
{#if showPreview && currentPreviewFile}
	<FilePreview
		fileId={currentPreviewFile.id}
		fileName={currentPreviewFile.name}
		fileType={currentPreviewFile.type || ''}
		onClose={() => {
			showPreview = false;
			currentPreviewFile = null;
		}}
	/>
{/if}

<!-- Modal d'assignation de projet -->
{#if showAssignmentModal}
	<ProjectAssignmentModal
		{material}
		{projects}
		on:assigned={handleProjectAssignment}
		on:close={() => showAssignmentModal = false}
	/>
{/if}