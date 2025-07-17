<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Upload, X, FileText, Trash2 } from 'lucide-svelte';

	const dispatch = createEventDispatcher();

	let files: FileList | null = null;
	let dragActive = false;
	let fileInput: HTMLInputElement;
	let isUploading = false;
	let selectedFiles: File[] = [];

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragActive = false;

		if (e.dataTransfer?.files) {
			addFiles(e.dataTransfer.files);
		}
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragActive = true;
	}

	function handleDragLeave() {
		dragActive = false;
	}

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files) {
			addFiles(target.files);
		}
	}

	function addFiles(fileList: FileList) {
		const newFiles = Array.from(fileList);
		selectedFiles = [...selectedFiles, ...newFiles];
		// Reset input
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function removeFile(index: number) {
		selectedFiles = selectedFiles.filter((_, i) => i !== index);
	}

	async function upload() {
		if (selectedFiles.length === 0) return;

		isUploading = true;

		try {
			// Create FileList-like object
			const dataTransfer = new DataTransfer();
			selectedFiles.forEach(file => dataTransfer.items.add(file));

			dispatch('upload', dataTransfer.files);
		} catch (error) {
			console.error('Error uploading files:', error);
		} finally {
			isUploading = false;
		}
	}

	function cancel() {
		dispatch('cancel');
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function getFileTypeColor(fileName: string): string {
		return 'text-gray-700 bg-gray-100';
	}
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
	<div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
		<!-- Header -->
		<div class="flex items-center justify-between p-6 border-b border-gray-200">
			<h3 class="text-xl font-bold text-gray-800">Upload Files</h3>
			<button
				class="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
				on:click={cancel}
				disabled={isUploading}
			>
				<X size={20} />
			</button>
		</div>

		<!-- Upload Area -->
		<div class="p-6">
			<div
				class="border-2 border-dashed rounded-xl p-8 text-center transition-colors {dragActive ? 'border-[#6B9AD9] bg-blue-50' : 'border-gray-300 hover:border-[#6B9AD9] hover:bg-gray-50'}"
				on:drop={handleDrop}
				on:dragover={handleDragOver}
				on:dragleave={handleDragLeave}
			>
				<div class="p-4 bg-[#6B9AD9] bg-opacity-10 rounded-full w-16 h-16 mx-auto mb-4">
					<Upload class="mx-auto text-[#6B9AD9]" size={32} />
				</div>
				<p class="text-gray-700 mb-4 text-lg">
					Drag and drop files here
				</p>
				<p class="text-gray-500 mb-4">or</p>
				<button
					class="px-6 py-3 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors font-medium"
					on:click={() => fileInput.click()}
					disabled={isUploading}
				>
					Browse Files
				</button>

				<input
					bind:this={fileInput}
					type="file"
					multiple
					class="hidden"
					on:change={handleFileSelect}
					disabled={isUploading}
				/>
			</div>
		</div>

		<!-- Selected Files -->
		{#if selectedFiles.length > 0}
			<div class="px-6 pb-6">
				<div class="bg-gray-50 rounded-lg p-4">
					<div class="flex items-center justify-between mb-4">
						<h4 class="font-semibold text-gray-800">Selected Files ({selectedFiles.length})</h4>
						<button
							class="text-sm text-gray-600 hover:text-red-600 transition-colors"
							on:click={() => selectedFiles = []}
							disabled={isUploading}
						>
							Clear All
						</button>
					</div>

					<div class="max-h-48 overflow-y-auto space-y-2">
						{#each selectedFiles as file, index}
							<div class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
								<div class="flex items-center gap-3 flex-1 min-w-0">
									<div class="p-2 rounded-lg {getFileTypeColor(file.name)}">
										<FileText size={16} />
									</div>
									<div class="flex-1 min-w-0">
										<p class="text-sm font-medium text-gray-800 truncate">{file.name}</p>
										<p class="text-xs text-gray-500">{formatFileSize(file.size)}</p>
									</div>
								</div>
								<button
									class="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
									on:click={() => removeFile(index)}
									disabled={isUploading}
								>
									<Trash2 size={16} />
								</button>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}

		<!-- Footer -->
		<div class="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
			<div class="text-sm text-gray-600">
				{#if selectedFiles.length > 0}
					Total: {selectedFiles.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024 < 1
					? formatFileSize(selectedFiles.reduce((sum, file) => sum + file.size, 0))
					: (selectedFiles.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(2) + ' MB'}
				{/if}
			</div>

			<div class="flex gap-3">
				<button
					class="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
					on:click={cancel}
					disabled={isUploading}
				>
					Cancel
				</button>
				<button
					class="px-6 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
					disabled={selectedFiles.length === 0 || isUploading}
					on:click={upload}
				>
					{#if isUploading}
						<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
					{/if}
					Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
				</button>
			</div>
		</div>
	</div>
</div>