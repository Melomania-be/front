<!-- src/lib/components/filesystem/FilePreview.svelte - VERSION COMPLÈTE AVEC PARTAGE -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2, Shield } from 'lucide-svelte';

	export let fileId: number;
	export let fileName: string;
	export let fileType: string;
	export let isShared = false;  // ✅ AJOUT : Indicateur de partage
	export let shareToken = '';   // ✅ AJOUT : Token de partage
	export let onClose: () => void;

	let isLoading = true;
	let error = '';
	let fileUrl = '';
	let downloadUrl = '';  // ✅ AJOUT : URL de téléchargement séparée
	let zoom = 1;
	let rotation = 0;
	let fullscreen = false;

	// ✅ MODIFICATION : URLs adaptées selon le contexte
	$: {
		if (isShared && shareToken) {
			// Mode partage - URLs publiques
			fileUrl = `/api/filesystem/shared/${shareToken}/download/${fileId}`;
			downloadUrl = `/api/filesystem/shared/${shareToken}/download/${fileId}`;
		} else {
			// Mode normal - URLs protégées
			fileUrl = `/api/files/stream/${fileId}`;
			downloadUrl = `/api/files/download/${fileId}`;
		}
	}

	// Détecter le type de fichier
	function getFileCategory(fileName: string, mimeType: string = '') {
		const extension = fileName.split('.').pop()?.toLowerCase() || '';
		const mime = mimeType.toLowerCase();

		// Documents PDF
		if (extension === 'pdf' || mime.includes('pdf')) return 'pdf';

		// Images
		if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'].includes(extension) ||
			mime.startsWith('image/')) return 'image';

		// Vidéos
		if (['mp4', 'webm', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'm4v', '3gp', 'ogv'].includes(extension) ||
			mime.startsWith('video/')) return 'video';

		// Audio
		if (['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'wma', 'opus', 'oga'].includes(extension) ||
			mime.startsWith('audio/')) return 'audio';

		// Documents Office
		if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension) ||
			mime.includes('officedocument') || mime.includes('msword') || mime.includes('ms-excel') || mime.includes('ms-powerpoint')) return 'office';

		// Texte
		if (['txt', 'rtf', 'md', 'csv'].includes(extension) ||
			mime.startsWith('text/')) return 'text';

		// Code
		if (['html', 'css', 'js', 'ts', 'json', 'xml', 'sql', 'py', 'java', 'cpp', 'c', 'php'].includes(extension)) return 'code';

		return 'unknown';
	}

	$: fileCategory = getFileCategory(fileName, fileType);

	onMount(() => {
		loadFile();
		// Écouter l'événement de téléchargement personnalisé
		document.addEventListener('download-file', downloadFile);
		return () => {
			document.removeEventListener('download-file', downloadFile);
		};
	});

	async function loadFile() {
		try {
			// fileUrl est déjà défini par la réactivité $:
			isLoading = false;
		} catch (error) {
			console.error('Error loading file:', error);
			error = 'Failed to load file';
			isLoading = false;
		}
	}

	async function downloadFile() {
		try {
			const response = await fetch(downloadUrl);
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
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}

	function zoomIn() {
		zoom = Math.min(zoom * 1.2, 3);
	}

	function zoomOut() {
		zoom = Math.max(zoom / 1.2, 0.1);
	}

	function rotate() {
		rotation = (rotation + 90) % 360;
	}

	function toggleFullscreen() {
		fullscreen = !fullscreen;
	}

	// Rendu conditionnel selon le type de fichier - VERSION CORRIGÉE pour Edge
	function renderPreview() {
		switch (fileCategory) {
			case 'pdf':
				return `
					<div class="w-full h-full flex flex-col">
						<div class="p-3 bg-blue-50 border-b flex items-center justify-between">
							<span class="text-sm text-blue-700">PDF Preview: ${fileName}</span>
							<button
								onclick="window.open('${fileUrl}', '_blank')"
								class="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
							>
								Open in New Tab
							</button>
						</div>
						<iframe
							src="${fileUrl}"
							class="flex-1 border-0"
							title="PDF Preview: ${fileName}"
							onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
						></iframe>
						<div style="display:none;" class="flex-1 flex items-center justify-center">
							<div class="text-center">
								<p class="text-gray-600 mb-4">PDF preview blocked by browser</p>
								<button
									onclick="window.open('${fileUrl}', '_blank')"
									class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
								>
									Open in New Tab
								</button>
								<button
									onclick="document.dispatchEvent(new CustomEvent('download-file'))"
									class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
								>
									Download
								</button>
							</div>
						</div>
					</div>
				`;

			case 'image':
				return `
					<div class="flex items-center justify-center h-full overflow-auto">
						<img
							src="${fileUrl}"
							alt="${fileName}"
							class="max-w-full max-h-full object-contain transition-transform"
							style="transform: scale(${zoom}) rotate(${rotation}deg)"
						/>
					</div>
				`;

			case 'video':
				return `
					<div class="flex items-center justify-center h-full p-4">
						<video
							controls
							class="max-w-full max-h-full"
							src="${fileUrl}"
						>
							Your browser does not support the video tag.
						</video>
					</div>
				`;

			case 'audio':
				return `
					<div class="flex items-center justify-center h-full">
						<div class="text-center">
							<div class="mb-4 text-6xl">🎵</div>
							<h3 class="text-lg font-semibold mb-4">${fileName}</h3>
							<audio controls class="w-full max-w-md">
								<source src="${fileUrl}" type="${fileType}">
								Your browser does not support the audio element.
							</audio>
						</div>
					</div>
				`;

			case 'text':
				return `
					<div class="w-full h-full flex flex-col">
						<div class="p-2 bg-gray-50 border-b flex items-center justify-between">
							<span class="text-sm text-gray-700">Text file: ${fileName}</span>
							<button
								onclick="window.open('${fileUrl}', '_blank')"
								class="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
							>
								Open in New Tab
							</button>
						</div>
						<iframe
							src="${fileUrl}"
							class="flex-1 border-0 bg-white"
							title="Text Preview: ${fileName}"
							onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
						></iframe>
						<div style="display:none;" class="flex-1 flex items-center justify-center">
							<div class="text-center">
								<p class="text-gray-600 mb-4">Text preview blocked by browser</p>
								<button
									onclick="window.open('${fileUrl}', '_blank')"
									class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
								>
									Open in New Tab
								</button>
								<button
									onclick="document.dispatchEvent(new CustomEvent('download-file'))"
									class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
								>
									Download
								</button>
							</div>
						</div>
					</div>
				`;

			case 'code':
				return `
					<div class="w-full h-full flex flex-col">
						<div class="p-2 bg-gray-900 text-green-400 border-b flex items-center justify-between">
							<span class="text-sm">Code file: ${fileName}</span>
							<button
								onclick="window.open('${fileUrl}', '_blank')"
								class="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
							>
								Open in New Tab
							</button>
						</div>
						<iframe
							src="${fileUrl}"
							class="flex-1 border-0 bg-gray-900 text-green-400"
							title="Code Preview: ${fileName}"
							onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
						></iframe>
						<div style="display:none;" class="flex-1 flex items-center justify-center bg-gray-900">
							<div class="text-center">
								<p class="text-green-400 mb-4">Code preview blocked by browser</p>
								<button
									onclick="window.open('${fileUrl}', '_blank')"
									class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
								>
									Open in New Tab
								</button>
								<button
									onclick="document.dispatchEvent(new CustomEvent('download-file'))"
									class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
								>
									Download
								</button>
							</div>
						</div>
					</div>
				`;

			case 'office':
				return `
					<div class="flex items-center justify-center h-full">
						<div class="text-center">
							<div class="mb-4 text-6xl">📄</div>
							<h3 class="text-lg font-semibold mb-4">${fileName}</h3>
							<p class="text-gray-600 mb-4">Office document preview not available in browser</p>
							<button
								onclick="window.open('${fileUrl}', '_blank')"
								class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
							>
								Open in New Tab
							</button>
							<button
								onclick="document.dispatchEvent(new CustomEvent('download-file'))"
								class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
							>
								Download
							</button>
						</div>
					</div>
				`;

			default:
				return `
					<div class="flex items-center justify-center h-full">
						<div class="text-center">
							<div class="mb-4 text-6xl">📁</div>
							<h3 class="text-lg font-semibold mb-4">${fileName}</h3>
							<p class="text-gray-600 mb-4">Preview not available for this file type</p>
							<button
								onclick="window.open('${fileUrl}', '_blank')"
								class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
							>
								Open in New Tab
							</button>
							<button
								onclick="document.dispatchEvent(new CustomEvent('download-file'))"
								class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
							>
								Download
							</button>
						</div>
					</div>
				`;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Modal Backdrop -->
<div
	class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
	class:bg-opacity-95={fullscreen}
	on:click|self={onClose}
>
	<!-- Modal Content -->
	<div
		class="bg-white rounded-lg shadow-2xl {fullscreen ? 'w-full h-full' : 'w-full max-w-6xl h-5/6'} flex flex-col"
	>
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-gray-200">
			<div class="flex items-center gap-3">
				<!-- ✅ AJOUT : Indicateur de partage -->
				{#if isShared}
					<div class="w-8 h-8 bg-purple-100 rounded-[6px] flex items-center justify-center">
						<Shield size={16} class="text-purple-600" />
					</div>
				{/if}
				<h2 class="text-xl font-bold text-gray-800 truncate">{fileName}</h2>
				<span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
					{fileCategory.toUpperCase()}
				</span>
				<!-- ✅ AJOUT : Badge de partage -->
				{#if isShared}
					<span class="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded border border-purple-300">
						SHARED FILE - READ ONLY
					</span>
				{/if}
			</div>

			<!-- Controls -->
			<div class="flex items-center gap-2">
				{#if fileCategory === 'image'}
					<button
						class="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
						on:click={zoomOut}
						title="Zoom Out"
					>
						<ZoomOut size={20} />
					</button>
					<span class="text-sm text-gray-500 min-w-[60px] text-center">
						{Math.round(zoom * 100)}%
					</span>
					<button
						class="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
						on:click={zoomIn}
						title="Zoom In"
					>
						<ZoomIn size={20} />
					</button>
					<button
						class="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
						on:click={rotate}
						title="Rotate"
					>
						<RotateCw size={20} />
					</button>
				{/if}

				<button
					class="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
					on:click={toggleFullscreen}
					title="Toggle Fullscreen"
				>
					<Maximize2 size={20} />
				</button>

				<button
					class="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
					on:click={downloadFile}
					title="Download"
				>
					<Download size={20} />
				</button>

				<button
					class="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
					on:click={onClose}
					title="Close"
				>
					<X size={20} />
				</button>
			</div>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-hidden">
			{#if isLoading}
				<div class="flex items-center justify-center h-full">
					<div class="text-center">
						<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
						<p class="text-gray-600">Loading {fileName}...</p>
					</div>
				</div>
			{:else if error}
				<div class="flex items-center justify-center h-full">
					<div class="text-center">
						<div class="text-red-500 text-6xl mb-4">⚠️</div>
						<h3 class="text-lg font-semibold text-red-600 mb-2">Error Loading File</h3>
						<p class="text-gray-600 mb-4">{error}</p>
						<button
							class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							on:click={downloadFile}
						>
							Try Download Instead
						</button>
					</div>
				</div>
			{:else}
				<!-- Rendu dynamique selon le type de fichier -->
				<div class="w-full h-full">
					{@html renderPreview()}
				</div>
			{/if}
		</div>
	</div>
</div>