<!-- src/lib/components/filesystem/FileUploader.svelte - Design uniforme -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Upload, X, FileText, Trash2, CloudUpload } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	let files: FileList | null = null;
	let dragActive = false;
	let fileInput: HTMLInputElement;
	let isUploading = false;
	let selectedFiles: File[] = [];
	let isMobile = false;

	const checkMobile = () => {
		if (browser) {
			isMobile = window.innerWidth <= 768;
		}
	};

	onMount(() => {
		checkMobile();
		if (browser) {
			window.addEventListener('resize', checkMobile);
			return () => {
				window.removeEventListener('resize', checkMobile);
			};
		}
	});

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
		const extension = fileName.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'pdf':
				return 'text-red-600 bg-red-100 border-red-300';
			case 'jpg':
			case 'jpeg':
			case 'png':
			case 'gif':
			case 'webp':
				return 'text-green-600 bg-green-100 border-green-300';
			case 'mp3':
			case 'wav':
			case 'flac':
			case 'aac':
				return 'text-purple-600 bg-purple-100 border-purple-300';
			case 'mp4':
			case 'avi':
			case 'mov':
			case 'mkv':
				return 'text-orange-600 bg-orange-100 border-orange-300';
			default:
				return 'text-gray-700 bg-gray-100 border-gray-300';
		}
	}
</script>

<!-- Modal avec design uniforme -->
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
	<div class="bg-[#E7E7E7] rounded-[10px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
		<!-- Header -->
		<div class="bg-white border-2 border-[#8C8C8C] rounded-t-[10px] p-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 bg-[#6B9AD9] rounded-[8px] flex items-center justify-center">
						<CloudUpload size={20} class="text-white" />
					</div>
					<div>
						<h1 class="font-bold text-lg">UPLOAD FILES</h1>
						<p class="text-sm text-gray-600">Add files to your workspace</p>
					</div>
				</div>
				<button
					class="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-300 transition-colors"
					on:click={cancel}
					disabled={isUploading}
				>
					<X size={20} />
				</button>
			</div>
		</div>

		<div class="p-4 space-y-4">
			<!-- Upload Area -->
			<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
				<div
					class="border-2 border-dashed rounded-[8px] p-8 text-center transition-colors {dragActive ? 'border-[#6B9AD9] bg-blue-50' : 'border-gray-300 hover:border-[#6B9AD9] hover:bg-gray-50'}"
					on:drop={handleDrop}
					on:dragover={handleDragOver}
					on:dragleave={handleDragLeave}
				>
					<div class="w-16 h-16 bg-[#6B9AD9] bg-opacity-10 rounded-[10px] flex items-center justify-center mx-auto mb-4">
						<Upload class="text-[#6B9AD9]" size={32} />
					</div>
					<h3 class="text-gray-700 mb-4 text-lg font-bold">
						DRAG AND DROP FILES HERE
					</h3>
					<p class="text-gray-500 mb-4">or</p>
					<button
						class="px-6 py-3 bg-[#6B9AD9] text-white rounded-lg hover:bg-blue-600 border-2 border-blue-600 transition-colors font-semibold"
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
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
					<div class="flex items-center justify-between mb-4">
						<h2 class="font-bold text-lg flex items-center gap-2">
							<FileText class="text-[#6B9AD9]" size={20} />
							SELECTED FILES ({selectedFiles.length})
						</h2>
						<button
							class="text-sm text-gray-600 hover:text-red-600 transition-colors font-semibold"
							on:click={() => selectedFiles = []}
							disabled={isUploading}
						>
							Clear All
						</button>
					</div>

					<div class="max-h-48 overflow-y-auto space-y-2">
						{#each selectedFiles as file, index}
							<div class="flex items-center justify-between p-3 bg-gray-50 border-2 border-gray-300 rounded-[8px] hover:border-[#6B9AD9] transition-colors">
								<div class="flex items-center gap-3 flex-1 min-w-0">
									<div class="w-10 h-10 rounded-[6px] border-2 {getFileTypeColor(file.name)} flex items-center justify-center">
										<FileText size={16} />
									</div>
									<div class="flex-1 min-w-0">
										<p class="text-sm font-bold text-gray-800 truncate">{file.name}</p>
										<p class="text-xs text-gray-500">{formatFileSize(file.size)}</p>
									</div>
								</div>
								<button
									class="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-300 transition-colors"
									on:click={() => removeFile(index)}
									disabled={isUploading}
								>
									<Trash2 size={16} />
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Footer Actions -->
			<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
				<div class="flex {isMobile ? 'flex-col gap-3' : 'justify-between items-center'}">
					<div class="text-sm text-gray-600 font-semibold">
						{#if selectedFiles.length > 0}
							Total: {selectedFiles.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024 < 1
							? formatFileSize(selectedFiles.reduce((sum, file) => sum + file.size, 0))
							: (selectedFiles.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(2) + ' MB'}
						{:else}
							No files selected
						{/if}
					</div>

					<div class="flex {isMobile ? 'flex-col w-full' : 'gap-3'}">
						<button
							class="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-300 transition-colors font-semibold {isMobile ? 'w-full justify-center' : ''}"
							on:click={cancel}
							disabled={isUploading}
						>
							Cancel
						</button>
						<button
							class="px-6 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-blue-600 border-2 border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold {isMobile ? 'w-full' : ''}"
							disabled={selectedFiles.length === 0 || isUploading}
							on:click={upload}
						>
							{#if isUploading}
								<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
							{:else}
								<Upload size={16} />
							{/if}
							Upload {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
    /* Mobile responsiveness */
    @media (max-width: 768px) {
        :global(.gap-3) {
            gap: 0.5rem;
        }

        button {
            min-height: 44px;
        }
    }
</style>