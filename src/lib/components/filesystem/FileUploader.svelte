<!-- src/lib/components/filesystem/FileUploader.svelte - Design PARFAITEMENT uniforme -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Upload, X, FileText, Trash2, CloudUpload, Plus } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	let files: FileList | null = null;
	let dragActive = false;
	let fileInput: HTMLInputElement;
	let isUploading = false;
	let selectedFiles: File[] = [];
	let isMobile = false;
	let isTablet = false;
	let windowWidth = 0;

	// ✅ RESPONSIVE IDENTIQUE : Même logique que les autres composants
	const checkResponsive = () => {
		if (browser) {
			windowWidth = window.innerWidth;
			isMobile = window.innerWidth <= 768;
			isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
		}
	};

	onMount(() => {
		checkResponsive();
		if (browser) {
			window.addEventListener('resize', checkResponsive);
			return () => {
				window.removeEventListener('resize', checkResponsive);
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

	function getFileIcon(fileName: string): string {
		const extension = fileName.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'pdf':
				return '📄';
			case 'jpg':
			case 'jpeg':
			case 'png':
			case 'gif':
			case 'webp':
				return '🖼️';
			case 'mp3':
			case 'wav':
			case 'flac':
			case 'aac':
				return '🎵';
			case 'mp4':
			case 'avi':
			case 'mov':
			case 'mkv':
				return '🎬';
			default:
				return '📄';
		}
	}
</script>

<!-- ✅ DESIGN IDENTIQUE : Modal avec backdrop exact même style -->
<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
	<!-- ✅ DESIGN IDENTIQUE : Container principal même style que les autres pages -->
	<div class="bg-[#E7E7E7] rounded-[10px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">

		<!-- ✅ DESIGN IDENTIQUE : Header exact même style -->
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

		<!-- ✅ DESIGN IDENTIQUE : Content avec même padding et structure -->
		<div class="p-4 space-y-4">

			<!-- ✅ DESIGN IDENTIQUE : Upload Area avec même style que les cards -->
			<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
				<div
					class="border-2 border-dashed rounded-[8px] p-8 text-center transition-colors {
						dragActive
							? 'border-[#6B9AD9] bg-blue-50'
							: 'border-gray-300 hover:border-[#6B9AD9] hover:bg-gray-50'
					}"
					on:drop={handleDrop}
					on:dragover={handleDragOver}
					on:dragleave={handleDragLeave}
				>
					<!-- ✅ DESIGN IDENTIQUE : Icône container même style -->
					<div class="w-16 h-16 bg-[#6B9AD9] bg-opacity-10 rounded-[10px] flex items-center justify-center mx-auto mb-4">
						<Upload class="text-[#6B9AD9]" size={32} />
					</div>

					<h3 class="text-gray-700 mb-4 text-lg font-bold">
						DRAG AND DROP FILES HERE
					</h3>
					<p class="text-gray-500 mb-4">or</p>

					<!-- ✅ DESIGN IDENTIQUE : Bouton principal même style -->
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

			<!-- ✅ DESIGN IDENTIQUE : Selected Files section -->
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

					<!-- ✅ DESIGN IDENTIQUE : Files list même style que FileSystemExplorer -->
					<div class="max-h-48 overflow-y-auto space-y-{isMobile ? '2' : '3'}">
						{#each selectedFiles as file, index}
							<div class="flex items-center justify-between p-{isMobile ? '3' : '4'} bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 rounded-[10px] hover:border-[#6B9AD9] transition-all duration-200 group">
								<div class="flex items-center gap-{isMobile ? '2' : '3'} flex-1 min-w-0">
									<!-- ✅ DESIGN IDENTIQUE : File icon même style -->
									<div class="w-12 h-12 bg-gray-100 rounded-[8px] border-2 border-gray-300 group-hover:border-[#6B9AD9] transition-colors flex items-center justify-center">
										<span class="text-lg">{getFileIcon(file.name)}</span>
									</div>

									<div class="flex-1 min-w-0">
										<div class="flex {isMobile ? 'flex-col gap-1' : 'items-center justify-between'} mb-2">
											<h3 class="font-bold text-gray-900 truncate {isMobile ? 'text-sm' : ''}" title={file.name}>{file.name}</h3>
											{#if !isMobile}
												<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-semibold border border-blue-300">
													{formatFileSize(file.size)}
												</span>
											{/if}
										</div>

										<!-- ✅ DESIGN IDENTIQUE : File details même grid -->
										<div class="grid grid-cols-1 {isMobile ? 'gap-1' : 'md:grid-cols-2 gap-4'} text-sm">
											<div class="min-w-0">
												<span class="font-medium text-gray-700">Type:</span>
												<span class="text-gray-600 {isMobile ? 'ml-2' : 'block'} break-words">
													{file.name.split('.').pop()?.toUpperCase() || 'FILE'}
												</span>
											</div>
											{#if isMobile}
												<div class="min-w-0">
													<span class="font-medium text-gray-700">Size:</span>
													<span class="text-gray-600 ml-2">{formatFileSize(file.size)}</span>
												</div>
											{/if}
										</div>
									</div>
								</div>

								<!-- ✅ DESIGN IDENTIQUE : Action button même style -->
								<button
									class="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-300 transition-colors {isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}"
									on:click={() => removeFile(index)}
									disabled={isUploading}
									title="Remove file"
								>
									<Trash2 size={16} />
								</button>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- ✅ DESIGN IDENTIQUE : Footer Actions même style -->
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

					<div class="flex {isMobile ? 'flex-col w-full gap-2' : 'gap-3'}">
						<button
							class="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-300 transition-colors font-semibold {isMobile ? 'w-full justify-center' : ''}"
							on:click={cancel}
							disabled={isUploading}
						>
							Cancel
						</button>

						<!-- ✅ DESIGN IDENTIQUE : Upload button principal même style -->
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

<!-- ✅ DESIGN IDENTIQUE : CSS exact même que les autres composants -->
<style>
    /* Mobile-specific responsive adjustments - EXACT COPY from other components */
    @media (max-width: 768px) {
        :global(.md\:grid-cols-2) {
            grid-template-columns: repeat(1, minmax(0, 1fr));
        }

        :global(.space-y-4) > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0.75rem;
        }

        :global(.space-y-3) > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0.5rem;
        }

        :global(.space-y-2) > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0.5rem;
        }

        :global(.gap-4) {
            gap: 0.75rem;
        }

        :global(.gap-3) {
            gap: 0.5rem;
        }

        :global(.gap-2) {
            gap: 0.25rem;
        }

        /* Improve touch targets on mobile */
        button {
            min-height: 44px;
        }

        /* Disable hover effects on mobile */
        .group:hover {
            transform: none;
        }

        .group-hover\:scale-110 {
            transition: none;
        }

        .group-hover\:opacity-100 {
            opacity: 1;
        }

        /* Force text wrapping and prevent overflow */
        .break-words {
            word-wrap: break-word;
            word-break: break-word;
            overflow-wrap: break-word;
        }

        .truncate {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .min-w-0 {
            min-width: 0;
        }
    }

    /* Force text wrapping globally */
    .break-words {
        word-wrap: break-word;
        word-break: break-word;
        overflow-wrap: break-word;
    }

    /* Improve file list scrolling on mobile */
    @media (max-width: 768px) {
        .max-h-48 {
            max-height: 16rem;
        }
    }

    /* Drag and drop visual feedback */
    .border-dashed {
        border-style: dashed;
    }

    /* Smooth transitions for all interactive elements */
    button, .group {
        transition: all 200ms ease-in-out;
    }

    /* Ensure modal is properly centered on all screen sizes */
    .fixed.inset-0 {
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>