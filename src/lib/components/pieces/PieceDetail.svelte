<!-- src/lib/components/pieces/PieceDetail.svelte (version mise à jour) -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Music, Download, Upload, Plus, FileText, Eye, Folder, Package } from 'lucide-svelte';
	import type { Piece } from '$lib/types/Piece';
	import type { Material } from '$lib/types/Material';
	import FileUploader from '../filesystem/FileUploader.svelte';
	import MaterialManager from '../materials/MaterialManager.svelte';

	export let piece: Piece;

	let scores: any[] = [];
	let materials: Material[] = [];
	let isLoading = true;
	let showUploader = false;
	let activeTab: 'materials' | 'legacy' = 'materials';

	onMount(async () => {
		await Promise.all([loadScores(), loadMaterials()]);
		isLoading = false;
	});

	async function loadScores() {
		try {
			const response = await fetch(`/api/pieces/${piece.id}/scores`);
			if (response.ok) {
				scores = await response.json();
			}
		} catch (error) {
			console.error('Error loading scores:', error);
		}
	}

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

	async function handleUpload(files: FileList) {
		const formData = new FormData();
		Array.from(files).forEach(file => {
			formData.append('files', file);
		});
		formData.append('pieceId', piece.id.toString());

		try {
			const response = await fetch('/api/filesystem/upload', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				await loadScores();
				showUploader = false;
			}
		} catch (error) {
			console.error('Error uploading files:', error);
		}
	}

	async function downloadScore(score: any) {
		try {
			const response = await fetch(`/api/files/download/${score.id}`);
			if (response.ok) {
				const blob = await response.blob();
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = score.name;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			}
		} catch (error) {
			console.error('Error downloading score:', error);
		}
	}

	function previewScore(score: any) {
		window.open(`/api/files/stream/${score.id}`, '_blank');
	}

	function getFileIcon(fileName: string) {
		const extension = fileName.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'pdf':
				return FileText;
			case 'jpg':
			case 'jpeg':
			case 'png':
				return Eye;
			default:
				return Music;
		}
	}

	function getFileColor(fileName: string) {
		const extension = fileName.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'pdf':
				return 'bg-red-50 text-red-600 border-red-200';
			case 'jpg':
			case 'jpeg':
			case 'png':
				return 'bg-green-50 text-green-600 border-green-200';
			default:
				return 'bg-blue-50 text-blue-600 border-blue-200';
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function handleMaterialsUpdated() {
		loadMaterials();
	}
</script>

<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
	<!-- Header -->
	<div class="flex items-center justify-between mb-6">
		<div>
			<h2 class="text-2xl font-bold text-gray-700 uppercase">{piece.name}</h2>
			<p class="text-gray-500 mt-1">
				by {piece.composer.longName}
				{#if piece.opus} • Op. {piece.opus}{/if}
				{#if piece.yearOfComposition} • {piece.yearOfComposition}{/if}
			</p>
		</div>
	</div>

	<!-- Onglets -->
	<div class="border-b border-gray-200 mb-6">
		<nav class="flex space-x-8">
			<button
				class="py-2 px-1 border-b-2 font-medium text-sm transition-colors {
					activeTab === 'materials'
						? 'border-[#6B9AD9] text-[#6B9AD9]'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
				}"
				on:click={() => activeTab = 'materials'}
			>
				<div class="flex items-center gap-2">
					<Package size={16} />
					Matériels ({materials.length})
				</div>
			</button>

			<button
				class="py-2 px-1 border-b-2 font-medium text-sm transition-colors {
					activeTab === 'legacy'
						? 'border-[#6B9AD9] text-[#6B9AD9]'
						: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
				}"
				on:click={() => activeTab = 'legacy'}
			>
				<div class="flex items-center gap-2">
					<Folder size={16} />
					Fichiers anciens ({scores.length})
				</div>
			</button>
		</nav>
	</div>

	<!-- Contenu des onglets -->
	{#if activeTab === 'materials'}
		<!-- Gestionnaire de matériels -->
		<MaterialManager
			{piece}
			on:materialsUpdated={handleMaterialsUpdated}
		/>
	{:else}
		<!-- Ancienne section des scores -->
		<div class="border-t-2 border-[#E7E7E7] pt-6">
			<div class="flex items-center justify-between mb-4">
				<div class="flex items-center gap-2">
					<Folder class="text-orange-500" size={20} />
					<h3 class="font-bold text-lg text-gray-700">FICHIERS ANCIENS</h3>
				</div>
				<button
					class="flex items-center gap-2 px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors"
					on:click={() => showUploader = true}
				>
					<Upload size={16} />
					Ajouter des fichiers
				</button>
			</div>

			{#if isLoading}
				<div class="flex justify-center items-center h-32">
					<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6B9AD9]"></div>
				</div>
			{:else if scores.length === 0}
				<div class="text-center py-8">
					<Music class="mx-auto mb-4 text-gray-400" size={48} />
					<p class="text-gray-500 mb-2">Aucun fichier ancien pour cette pièce</p>
					<p class="text-sm text-gray-400 mb-4">
						Les nouveaux fichiers doivent être organisés dans des matériels.
					</p>
					<button
						class="text-[#6B9AD9] hover:underline"
						on:click={() => activeTab = 'materials'}
					>
						Voir les matériels
					</button>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each scores as score}
						<div class="border-2 {getFileColor(score.name)} rounded-lg p-4 hover:shadow-md transition-all duration-200">
							<div class="flex items-start justify-between mb-3">
								<div class="flex items-center gap-2">
									<svelte:component this={getFileIcon(score.name)} size={20} />
									<div class="flex-1 min-w-0">
										<h4 class="font-medium text-gray-800 truncate" title={score.name}>
											{score.name}
										</h4>
										<p class="text-sm text-gray-500">{formatFileSize(score.size || 0)}</p>
									</div>
								</div>
							</div>

							<div class="flex gap-2">
								<button
									class="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
									on:click={() => previewScore(score)}
								>
									<Eye size={14} />
									Preview
								</button>
								<button
									class="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors text-sm"
									on:click={() => downloadScore(score)}
								>
									<Download size={14} />
									Download
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<!-- Projets utilisant cette pièce -->
	<div class="border-t-2 border-[#E7E7E7] pt-6 mt-6">
		<h3 class="font-bold text-lg text-gray-700 mb-4">PROJETS UTILISANT CETTE PIÈCE</h3>

		{#if piece.sections && piece.sections.length > 0}
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				{#each piece.sections as project}
					<div class="p-4 bg-gradient-to-r from-[#6CB1C8] to-[#5077BA] text-white rounded-lg">
						<h4 class="font-semibold">{project.name}</h4>
						<p class="text-sm opacity-80">
							{project.pieces?.length || 0} pièce{project.pieces?.length !== 1 ? 's' : ''} total
						</p>
						{#if project.pivot_material_id}
							<p class="text-xs opacity-75 mt-1">
								Matériel spécifié
							</p>
						{:else}
							<p class="text-xs opacity-75 mt-1 text-orange-200">
								Matériel à spécifier
							</p>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="text-center py-4">
				<p class="text-gray-500">Cette pièce n'est utilisée dans aucun projet</p>
			</div>
		{/if}
	</div>
</div>

{#if showUploader}
	<FileUploader
		on:upload={(e) => handleUpload(e.detail)}
		on:cancel={() => showUploader = false}
	/>
{/if}