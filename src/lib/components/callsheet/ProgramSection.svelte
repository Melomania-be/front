<script lang="ts">
	import type { Callsheet } from '$lib/types/Callsheet';
	import Accordion from '$lib/components/Accordion.svelte';
	import { Download, Music, FileText, Eye, AlertCircle, Clock } from 'lucide-svelte';
	import FilePreview from '$lib/components/filesystem/FilePreview.svelte';

	export let callsheet: Callsheet;

	let showPreview = false;
	let previewFile: { id: number; name: string; type: string } | null = null;
	let downloadingFiles = new Set<number>();
	let downloadErrors = new Map<number, string>();

	// Fonction utilitaire pour formater la taille des fichiers
	function formatFileSize(bytes: number | null | undefined): string {
		if (!bytes || bytes === 0) return '';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
	}

	// Fonction améliorée de téléchargement avec loading state
	async function downloadScore(fileId: number, fileName: string) {
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

	function previewScore(fileId: number, fileName: string, fileType: string = '') {
		previewFile = { id: fileId, name: fileName, type: fileType };
		showPreview = true;
	}

	function getFileIcon(fileName: string) {
		const extension = fileName.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'pdf':
				return FileText;
			case 'jpg':
			case 'jpeg':
			case 'png':
			case 'gif':
			case 'webp':
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

	function getFileTypeLabel(fileName: string): string {
		const extension = fileName.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'pdf':
				return 'PDF';
			case 'jpg':
			case 'jpeg':
			case 'png':
			case 'gif':
			case 'webp':
				return 'Image';
			case 'mp3':
			case 'wav':
			case 'flac':
			case 'aac':
				return 'Audio';
			case 'mid':
			case 'midi':
				return 'MIDI';
			default:
				return 'Score';
		}
	}

	function getFileColor(fileName: string) {
		return 'text-gray-700 bg-gray-100 border-gray-300';
	}

	// Fonction pour regrouper et organiser les fichiers
	function organizeFiles(piece: any) {
		const allFiles = [];

		// Fichiers du dossier
		if (piece.folder?.files) {
			allFiles.push(...piece.folder.files.map(f => ({ ...f, source: 'folder' })));
		}

		// Fichiers directs
		if (piece.files) {
			allFiles.push(...piece.files.map(f => ({ ...f, source: 'direct' })));
		}

		// Trier par nom et type
		return allFiles.sort((a, b) => {
			// D'abord par extension (PDF en premier)
			const extA = a.name.split('.').pop()?.toLowerCase() || '';
			const extB = b.name.split('.').pop()?.toLowerCase() || '';

			if (extA === 'pdf' && extB !== 'pdf') return -1;
			if (extA !== 'pdf' && extB === 'pdf') return 1;

			// Puis par nom
			return a.name.localeCompare(b.name);
		});
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

<div class="mb-10 py-8 text-center">
	<h2 class="text-2xl font-bold text-slate-500 dark:text-white mb-4">
		Program and scores
	</h2>

	<div class="overflow-x-auto border border-gray-300 dark:border-gray-600 rounded-xl max-w-5xl mx-auto">
		<table class="min-w-[600px] w-full table-auto text-left text-sm">
			<thead class="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white">
			<tr>
				<th class="px-4 sm:px-6 py-3 font-semibold">Composer</th>
				<th class="px-4 sm:px-6 py-3 font-semibold">Piece</th>
				<th class="px-4 sm:px-6 py-3 font-semibold">Scores</th>
			</tr>
			</thead>
			<tbody class="bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
			{#each callsheet.project?.pieces || [] as piece}
				{@const organizedFiles = organizeFiles(piece)}
				<tr class="border-t border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600">
					<td class="px-4 sm:px-6 py-4 align-top">
						<div class="font-medium">{piece.composer.shortName}</div>
						<div class="text-sm text-gray-500 dark:text-gray-400">{piece.composer.longName}</div>
					</td>
					<td class="px-4 sm:px-6 py-4 align-top">
						<div class="font-medium">{piece.name}</div>
						{#if piece.opus}
							<div class="text-sm text-gray-500 dark:text-gray-400">Op. {piece.opus}</div>
						{/if}
						{#if piece.yearOfComposition}
							<div class="text-sm text-gray-500 dark:text-gray-400">({piece.yearOfComposition})</div>
						{/if}
					</td>
					<td class="px-4 sm:px-6 py-4 align-top">
						{#if organizedFiles.length > 0}
							<div class="space-y-2">
								{#each organizedFiles as file}
									{@const isDownloading = downloadingFiles.has(file.id)}
									{@const downloadError = downloadErrors.get(file.id)}

									<div class="flex items-center gap-2 p-2 {getFileColor(file.name)} rounded-lg border hover:shadow-sm transition-all duration-200">
										<div class="flex-shrink-0">
											<svelte:component this={getFileIcon(file.name)} size={16} />
										</div>
										<div class="flex-1 min-w-0">
											<div class="text-sm font-medium truncate" title={file.name}>
												{file.name}
											</div>
											{#if file.size}
												<div class="text-xs text-gray-500">
													{formatFileSize(file.size)}
												</div>
											{/if}
										</div>
										<div class="flex gap-1">
											<button
												class="p-1.5 hover:bg-white hover:bg-opacity-70 rounded transition-colors disabled:opacity-50"
												on:click={() => previewScore(file.id, file.name, file.type || '')}
												disabled={isDownloading}
												title="Preview"
											>
												<Eye size={14} />
											</button>
											<button
												class="p-1.5 hover:bg-white hover:bg-opacity-70 rounded transition-colors disabled:opacity-50"
												on:click={() => downloadScore(file.id, file.name)}
												disabled={isDownloading}
												title="Download"
											>
												{#if isDownloading}
													<div class="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-current"></div>
												{:else}
													<Download size={14} />
												{/if}
											</button>
										</div>
									</div>

									{#if downloadError}
										<div class="text-xs text-red-600 dark:text-red-400 mt-1">
											Error: {downloadError}
										</div>
									{/if}
								{/each}
							</div>
						{:else}
							<div class="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-lg">
								<Music size={14} class="text-gray-400" />
								<span class="text-sm text-gray-500 dark:text-gray-400">No scores available</span>
							</div>
						{/if}
					</td>
				</tr>
			{/each}
			</tbody>
		</table>
	</div>

	{#if callsheet.project?.pieces && callsheet.project.pieces.length === 0}
		<div class="mt-8 text-center">
			<Music class="mx-auto mb-4 text-gray-400" size={48} />
			<p class="text-gray-500 dark:text-gray-400">No pieces in this project</p>
		</div>
	{/if}
</div>

<!-- File Preview Modal -->
{#if showPreview && previewFile}
	<FilePreview
		fileId={previewFile.id}
		fileName={previewFile.name}
		fileType={previewFile.type}
		onClose={() => {
			showPreview = false;
			previewFile = null;
		}}
	/>
{/if}

<style>
    /* Amélioration responsive des boutons */
    @media (max-width: 640px) {
        .truncate {
            max-width: 120px;
        }
    }

    /* Smooth transitions */
    .transition-all {
        transition: all 0.2s ease;
    }
</style>