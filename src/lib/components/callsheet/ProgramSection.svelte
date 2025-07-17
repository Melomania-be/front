<script lang="ts">
	import type { Callsheet } from '$lib/types/Callsheet';
	import Accordion from '$lib/components/Accordion.svelte';
	import { Download, Music, FileText, Eye } from 'lucide-svelte';
	import FilePreview from '$lib/components/filesystem/FilePreview.svelte';

	export let callsheet: Callsheet;

	let showPreview = false;
	let previewFile: { id: number; name: string; type: string } | null = null;

	async function downloadScore(fileId: number) {
		try {
			const response = await fetch(`/api/files/download/${fileId}`);
			if (response.ok) {
				const blob = await response.blob();
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `score_${fileId}`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(url);
			} else {
				console.error('Failed to download score');
			}
		} catch (error) {
			console.error('Error downloading score:', error);
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
				return Eye;
			default:
				return Music;
		}
	}

	function getFileColor(fileName: string) {
		const extension = fileName.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'pdf':
				return 'text-red-600 bg-red-50';
			case 'jpg':
			case 'jpeg':
			case 'png':
				return 'text-green-600 bg-green-50';
			default:
				return 'text-blue-600 bg-blue-50';
		}
	}
</script>

<div class="mb-10 py-8 text-center">
	<h2 class="text-2xl font-bold text-slate-500 dark:text-white mb-4">
		Program and scores
	</h2>

	<div class="overflow-x-auto border border-gray-300 dark:border-gray-600 rounded-xl max-w-4xl mx-auto">
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
						{#if (piece.folder?.files && piece.folder.files.length > 0) || (piece.files && piece.files.length > 0)}
							<div class="flex flex-wrap gap-2">
								<!-- Files from folder -->
								{#if piece.folder?.files}
									{#each piece.folder.files as file}
										<div class="flex items-center gap-1 px-3 py-2 {getFileColor(file.name)} rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
											<svelte:component this={getFileIcon(file.name)} size={14} />
											<span class="text-sm font-medium truncate max-w-[120px]" title={file.name}>
												{file.name}
											</span>
											<div class="flex gap-1 ml-2">
												<button
													class="p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
													on:click={() => previewScore(file.id, file.name, file.type || '')}
													title="Preview"
												>
													<Eye size={12} />
												</button>
												<button
													class="p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
													on:click={() => downloadScore(file.id)}
													title="Download"
												>
													<Download size={12} />
												</button>
											</div>
										</div>
									{/each}
								{/if}

								<!-- Direct files linked to piece -->
								{#if piece.files}
									{#each piece.files as file}
										<div class="flex items-center gap-1 px-3 py-2 {getFileColor(file.name)} rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200">
											<svelte:component this={getFileIcon(file.name)} size={14} />
											<span class="text-sm font-medium truncate max-w-[120px]" title={file.name}>
												{file.name}
											</span>
											<div class="flex gap-1 ml-2">
												<button
													class="p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
													on:click={() => previewScore(file.id, file.name, file.type || '')}
													title="Preview"
												>
													<Eye size={12} />
												</button>
												<button
													class="p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
													on:click={() => downloadScore(file.id)}
													title="Download"
												>
													<Download size={12} />
												</button>
											</div>
										</div>
									{/each}
								{/if}
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
        .max-w-\[120px\] {
            max-width: 80px;
        }
    }
</style>