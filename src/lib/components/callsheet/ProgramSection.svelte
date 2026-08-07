<script lang="ts">
	import type { Callsheet } from '$lib/types/Callsheet';
	import { Download, Music, FileText, Eye, AlertCircle, ChevronDown, ChevronRight } from 'lucide-svelte';
	import FilePreview from '$lib/components/filesystem/FilePreview.svelte';

	export let callsheet: Callsheet;

	let showPreview = false;
	let currentPreviewFile: { id: number; name: string; type: string } | null = null;
	let downloadingFiles = new Set<number>();
	let downloadErrors = new Map<number, string>();
	let expandedPieces = new Set<number>();
	let searchQuery = '';

	function formatFileSize(bytes: number | null | undefined): string {
		if (!bytes || bytes === 0) return '';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}

	async function downloadFile(fileId: number, fileName: string) {
		if (downloadingFiles.has(fileId)) return;

		downloadingFiles.add(fileId);
		downloadingFiles = downloadingFiles;
		downloadErrors.delete(fileId);
		downloadErrors = downloadErrors;

		try {
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
		} catch (error) {
			console.error('Download error:', error);
			downloadErrors.set(fileId, error instanceof Error ? error.message : 'Download failed');
			downloadErrors = downloadErrors;
		} finally {
			downloadingFiles.delete(fileId);
			downloadingFiles = downloadingFiles;
		}
	}

	function previewFile(fileId: number, fileName: string, fileType: string = '') {
		currentPreviewFile = { id: fileId, name: fileName, type: fileType };
		showPreview = true;
	}

	function getFileIcon(fileName: string) {
		const extension = fileName.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'pdf':
			case 'doc':
			case 'docx':
				return FileText;
			case 'jpg':
			case 'jpeg':
			case 'png':
			case 'gif':
			case 'webp':
			case 'svg':
			case 'tiff':
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

	function getFileColor(_fileName: string) {
		return 'text-gray-700 bg-gray-100 border-gray-300';
	}

	function togglePieceExpansion(pieceId: number) {
		if (expandedPieces.has(pieceId)) {
			expandedPieces.delete(pieceId);
		} else {
			expandedPieces.add(pieceId);
		}
		expandedPieces = new Set(expandedPieces);
	}

	function filterFiles(files: any[], query: string) {
		if (!query.trim()) return files;
		return files.filter((file) => file.name.toLowerCase().includes(query.toLowerCase()));
	}

	function getSelectedMaterialFiles(piece: any): any[] {
		return piece.selectedMaterial?.files || [];
	}

	$: {
		if (downloadErrors.size > 0) {
			setTimeout(() => {
				downloadErrors.clear();
				downloadErrors = downloadErrors;
			}, 5000);
		}
	}
</script>

<div class="mb-10 py-8">
	<div class="text-center mb-6">
		<h2 class="text-2xl font-bold text-slate-500 dark:text-white mb-2">Program and Scores</h2>
		<p class="text-sm text-gray-600 dark:text-gray-400">
			Access all musical materials and scores for this project
		</p>
	</div>

	{#if callsheet.project?.pieces && callsheet.project.pieces.length > 0}
		<div class="max-w-6xl mx-auto space-y-2">
			{#each callsheet.project.pieces as piece}
				{@const selectedFiles = getSelectedMaterialFiles(piece)}
				{@const filteredFiles = filterFiles(selectedFiles, searchQuery)}
				{@const isExpanded = expandedPieces.has(Number(piece.id))}

				<div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
					<div class="p-3 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 border-b border-gray-200 dark:border-gray-600">
						<button
							class="w-full flex flex-col gap-3 text-left hover:bg-white hover:bg-opacity-50 rounded p-2 transition-colors sm:flex-row sm:items-center sm:justify-between"
							on:click={() => togglePieceExpansion(Number(piece.id))}
						>
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-3">
									<div class="flex-shrink-0">
										{#if isExpanded}
											<ChevronDown size={16} class="text-gray-600 dark:text-gray-300" />
										{:else}
											<ChevronRight size={16} class="text-gray-600 dark:text-gray-300" />
										{/if}
									</div>
									<div class="flex-1 min-w-0">
										<h3 class="font-semibold text-lg text-gray-900 dark:text-white truncate">
											{piece.name}
										</h3>
										<div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
											<span>{piece.composer.shortName}</span>
											{#if piece.opus}
												<span>Op. {piece.opus}</span>
											{/if}
											{#if piece.yearOfComposition}
												<span>({piece.yearOfComposition})</span>
											{/if}
										</div>
									</div>
								</div>
							</div>

							<div class="flex w-full items-center justify-start gap-2 text-sm flex-shrink-0 sm:w-auto sm:justify-end">
								{#if selectedFiles.length > 0}
									<div class="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
										<FileText size={14} />
										<span>{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}</span>
									</div>
								{:else}
									<div class="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full">
										<AlertCircle size={14} />
										<span>No files</span>
									</div>
								{/if}
							</div>
						</button>
					</div>

					{#if isExpanded}
						<div class="p-4">
							{#if filteredFiles.length === 0}
								<div class="text-center py-8">
									<FileText class="mx-auto mb-4 text-gray-400" size={48} />
									<p class="text-gray-500 dark:text-gray-400">
										{searchQuery ? 'No files match your search' : 'No files available for this piece'}
									</p>
									<p class="text-sm text-gray-400 mt-2">Select a material in file management</p>
								</div>
							{:else}
								<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
									{#each filteredFiles as file}
										{@const isDownloading = downloadingFiles.has(file.id)}
										{@const downloadError = downloadErrors.get(file.id)}

										<div class="flex items-center gap-3 p-3 {getFileColor(file.name)} rounded-lg border hover:shadow-sm transition-all duration-200">
											<div class="flex-shrink-0">
												<svelte:component this={getFileIcon(file.name)} size={18} />
											</div>
											<div class="flex-1 min-w-0">
												<div class="text-sm font-medium truncate" title={file.name}>
													{file.name}
												</div>
												{#if file.size}
													<div class="text-xs text-gray-500 mt-1">
														{formatFileSize(file.size)}
													</div>
												{/if}
												{#if file.instrument_part}
													<div class="mt-1">
														<span class="inline-block px-2 py-0.5 bg-gray-200 rounded text-xs">
															{file.instrument_part}
														</span>
													</div>
												{/if}
											</div>
											<div class="flex gap-1 flex-shrink-0">
												<button
													class="p-1.5 hover:bg-white hover:bg-opacity-70 rounded transition-colors disabled:opacity-50"
													on:click={() => previewFile(file.id, file.name, file.type || '')}
													disabled={isDownloading}
													title="Preview"
												>
													<Eye size={16} />
												</button>
												<button
													class="p-1.5 hover:bg-white hover:bg-opacity-70 rounded transition-colors disabled:opacity-50"
													on:click={() => downloadFile(file.id, file.name)}
													disabled={isDownloading}
													title="Download"
												>
													{#if isDownloading}
														<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
													{:else}
														<Download size={16} />
													{/if}
												</button>
											</div>
										</div>

										{#if downloadError}
											<div class="col-span-full text-sm text-red-600 dark:text-red-400 px-3">
												Error: {downloadError}
											</div>
										{/if}
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center py-12">
			<Music class="mx-auto mb-4 text-gray-400" size={64} />
			<h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">No pieces in this project</h3>
			<p class="text-gray-500 dark:text-gray-400">
				Add pieces to the project to see materials and scores here.
			</p>
		</div>
	{/if}
</div>

{#if showPreview && currentPreviewFile}
	<FilePreview
		fileId={currentPreviewFile.id}
		fileName={currentPreviewFile.name}
		fileType={currentPreviewFile.type}
		onClose={() => {
			showPreview = false;
			currentPreviewFile = null;
		}}
	/>
{/if}

<style>
	.transition-all {
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.hover\:shadow-sm:hover {
		box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
	}
</style>
