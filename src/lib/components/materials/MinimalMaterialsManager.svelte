<!-- src/lib/components/materials/MinimalMaterialsManager.svelte - CORRIGÉ -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import {
		Package,
		Plus,
		Music,
		FileText,
		Trash2,
		Star,
		Upload,
		CheckCircle,
		Circle,
		Eye,
		Download,
		X,
		ChevronDown,
		ChevronRight,
		CloudUpload,
		File,
		Folder,
		Image,
		Video
	} from 'lucide-svelte';

	import FilePreview from '../filesystem/FilePreview.svelte';
	import FileUploader from '../filesystem/FileUploader.svelte';
	import Button from '$lib/components/Button.svelte';
	import { browser } from '$app/environment';

	import type { Material } from '$lib/types/Material';
	import type { Piece } from '$lib/types/Piece';

	const dispatch = createEventDispatcher();

	export let projectId: number | null = null;

	let materials: any[] = [];
	let pieces: any[] = [];
	let selectedPiece: any = null;
	let isLoading = true;
	let showCreateForm = false;
	let showUploader = false;
	let selectedMaterialForUpload: any = null;
	let isMobile = false;
	let isTablet = false;
	let windowWidth = 0;
	let expandedMaterials = new Set<number>();
	let showPreview = false;
	let previewFile: any = null;

	let newMaterialData = {
		name: '',
		description: '',
		edition: '',
		editor: '',
		notes: '',
		is_default: false
	};

	let selectedMaterials: Record<number, number | null> = {};

	// CORRECTION : setInterval retourne un number côté client
	let refreshInterval: number | null = null;

	const checkResponsive = () => {
		if (browser) {
			windowWidth = window.innerWidth;
			isMobile = window.innerWidth <= 768;
			isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
		}
	};

	// CORRECTION : onMount synchrone pour permettre le return cleanup
	onMount(() => {
		checkResponsive();

		if (browser) {
			window.addEventListener('resize', checkResponsive);
			// CORRECTION : typage explicite de l'EventListener
			window.addEventListener('materialSelectionChanged', handleMaterialSelectionChange as EventListener);

			refreshInterval = window.setInterval(() => {
				if (selectedPiece && !showCreateForm && !showUploader) {
					loadSelectedMaterialForPiece(selectedPiece.id);
				}
			}, 30000);
		}

		// On gère la promesse ici
		loadPieces().then(() => {
			isLoading = false;
		});

		return () => {
			if (browser) {
				window.removeEventListener('resize', checkResponsive);
				window.removeEventListener('materialSelectionChanged', handleMaterialSelectionChange as EventListener);
				if (refreshInterval) clearInterval(refreshInterval);
			}
		};
	});

	// CORRECTION : Caster le CustomEvent
	function handleMaterialSelectionChange(event: Event) {
		const customEvent = event as CustomEvent;
		const { pieceId, materialId } = customEvent.detail;

		if (selectedPiece && selectedPiece.id === pieceId) {
			selectedMaterials[pieceId] = materialId;
			selectedMaterials = { ...selectedMaterials };
		}
	}

	async function loadPieces() {
		try {
			let pieces_data = [];

			if (projectId) {
				const projectResponse = await fetch(`/api/projects/${projectId}`);
				if (projectResponse.ok) {
					const projectData = await projectResponse.json();
					pieces_data = projectData.pieces || [];
				} else {
					pieces_data = [];
				}
			} else {
				const response = await fetch('/api/pieces?limit=1000&page=1&filter=&orderBy=name&order=asc');
				if (response.ok) {
					const data = await response.json();
					pieces_data = data.data || data || [];
				}
			}
			pieces = pieces_data;
		} catch (err) {
			console.error('Error loading pieces:', err);
			pieces = [];
		}
	}

	async function loadMaterialsForPiece(piece: any) {
		try {
			selectedPiece = piece;
			const [materialsResponse, selectedMaterialPromise] = await Promise.allSettled([
				fetch(`/api/materials/piece/${piece.id}`),
				loadSelectedMaterialForPiece(piece.id)
			]);

			if (materialsResponse.status === 'fulfilled' && materialsResponse.value.ok) {
				const materialsData = await materialsResponse.value.json();
				const materialPromises = materialsData.map(async (material: any) => {
					try {
						const filesResponse = await fetch(`/api/materials/${material.id}/files`);
						if (filesResponse.ok) {
							const files = await filesResponse.json();
							material.files = Array.isArray(files) ? files : [];
							material.files_count = material.files.length;
						} else {
							material.files = [];
							material.files_count = 0;
						}
						return material;
					} catch (err) {
						material.files = [];
						material.files_count = 0;
						return material;
					}
				});

				materials = await Promise.all(materialPromises);
				materials = [...materials];

				if (isMobile) {
					materials.forEach(material => {
						if (material.files && material.files.length > 0) {
							expandedMaterials.add(material.id);
						}
					});
					expandedMaterials = new Set(expandedMaterials);
				}
			} else {
				materials = [];
			}
		} catch (err) {
			console.error('Error loading materials for piece:', piece.id, err);
			materials = [];
			selectedMaterials[piece.id] = null;
			selectedMaterials = { ...selectedMaterials };
		}
	}

	async function loadSelectedMaterialForPiece(pieceId: number, retryCount = 0): Promise<void> {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000);

			const response = await fetch(`/api/pieces/${pieceId}/select-material`, {
				signal: controller.signal
			});
			clearTimeout(timeoutId);

			if (response.ok) {
				const contentType = response.headers.get('content-type');
				if (!contentType || !contentType.includes('application/json')) {
					selectedMaterials[pieceId] = null;
					selectedMaterials = { ...selectedMaterials };
					return;
				}

				const result = await response.json();
				if (result && typeof result === 'object') {
					selectedMaterials[pieceId] = result.materialId;
				} else {
					selectedMaterials[pieceId] = null;
				}
			} else {
				selectedMaterials[pieceId] = null;
			}
			selectedMaterials = { ...selectedMaterials };

		} catch (err) {
			// CORRECTION : Cast d'erreur strict (unknown -> any)
			const error = err as any;
			console.error('Error loading selected material for piece:', pieceId, error);

			if (error.name === 'AbortError') {
				console.warn(`Request timeout for piece ${pieceId}`);
			} else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
				console.warn(`Network error for piece ${pieceId}`);
			}

			if (retryCount < 2 && error.name !== 'AbortError') {
				setTimeout(() => {
					loadSelectedMaterialForPiece(pieceId, retryCount + 1);
				}, (retryCount + 1) * 2000);
			} else {
				selectedMaterials[pieceId] = null;
				selectedMaterials = { ...selectedMaterials };
			}
		}
	}

	async function selectMaterial(pieceId: number, materialId: number | null) {
		// CORRECTION : previousSelection déclaré en dehors du bloc try pour y accéder dans le catch
		const previousSelection = selectedMaterials[pieceId];

		try {
			selectedMaterials[pieceId] = materialId;
			selectedMaterials = { ...selectedMaterials };

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000);

			const response = await fetch(`/api/pieces/${pieceId}/select-material`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ materialId }),
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (response.ok) {
				const contentType = response.headers.get('content-type');
				if (!contentType || !contentType.includes('application/json')) {
					throw new Error('Invalid response format');
				}

				const result = await response.json();
				if (result && result.success) {
					dispatch('materialsUpdated');
					window.dispatchEvent(new CustomEvent('materialSelectionChanged', {
						detail: {
							pieceId,
							materialId,
							pieceName: selectedPiece?.name,
							timestamp: Date.now()
						}
					}));

					if (projectId) {
						await syncProjectMaterialSelections();
					}
				} else {
					throw new Error(result?.error || 'Unknown backend error');
				}
			} else {
				let errorMessage = 'Backend error';
				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
				} catch {
					errorMessage = `HTTP ${response.status} ${response.statusText}`;
				}
				throw new Error(errorMessage);
			}
		} catch (err) {
			const error = err as any;
			console.error('Error selecting material, rolling back:', error);
			selectedMaterials[pieceId] = previousSelection;
			selectedMaterials = { ...selectedMaterials };

			let userMessage = 'Error selecting material';
			if (error.name === 'AbortError') {
				userMessage = 'Request timeout - please try again';
			} else if (error.message && error.message.includes('Failed to fetch')) {
				userMessage = 'Network error - check your connection';
			} else if (error.message) {
				userMessage = `Error: ${error.message}`;
			}
			alert(userMessage);
		}
	}

	async function syncProjectMaterialSelections() {
		if (!projectId) return;

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 15000);

			const response = await fetch(`/api/projects/${projectId}/sync-material-selections`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (response.ok) {
				const contentType = response.headers.get('content-type');
				if (contentType && contentType.includes('application/json')) {
					const result = await response.json();
					if (!result.success) {
						console.warn('Sync completed with warnings:', result.errors);
					}
				}
			}
		} catch (err) {
			const error = err as any;
			if (error.name === 'AbortError') {
				console.warn('Sync timeout - continuing anyway');
			}
		}
	}

	async function createMaterial() {
		if (!newMaterialData.name.trim() || !selectedPiece) {
			alert('Please fill in all required fields');
			return;
		}

		try {
			const materialData = {
				...newMaterialData,
				piece_id: selectedPiece.id
			};

			const response = await fetch('/api/materials', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(materialData)
			});

			if (response.ok) {
				const result = await response.json();
				await loadMaterialsForPiece(selectedPiece);
				showCreateForm = false;
				newMaterialData = {
					name: '',
					description: '',
					edition: '',
					editor: '',
					notes: '',
					is_default: false
				};
				dispatch('materialsUpdated');

				if (result.material?.is_default) {
					await selectMaterial(selectedPiece.id, result.material.id);
				}
			} else {
				const error = await response.json();
				alert('Creation error: ' + (error.message || 'Unknown error'));
			}
		} catch (err) {
			console.error('Error creating material:', err);
			alert('Error creating material');
		}
	}

	async function deleteMaterial(material: any) {
		if (!confirm(`Are you sure you want to delete the material "${material.name}"?`)) {
			return;
		}

		try {
			const response = await fetch(`/api/materials/${material.id}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				if (selectedMaterials[selectedPiece.id] === material.id) {
					await selectMaterial(selectedPiece.id, null);
				}
				if (selectedPiece) {
					await loadMaterialsForPiece(selectedPiece);
				}
				dispatch('materialsUpdated');
			} else {
				alert('Error deleting material');
			}
		} catch (err) {
			console.error('Error deleting material:', err);
			alert('Error deleting material');
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	function getFileIcon(fileName: string) {
		const extension = fileName.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'pdf': case 'doc': case 'docx': return FileText;
			case 'jpg': case 'jpeg': case 'png': case 'gif': case 'webp': case 'svg': case 'bmp': case 'tiff': return Image;
			case 'mp3': case 'wav': case 'flac': case 'aac': case 'ogg': case 'm4a': return Music;
			case 'mp4': case 'avi': case 'mov': case 'mkv': case 'webm': return Video;
			default: return File;
		}
	}

	function getFileColor(fileName: string): string {
		const extension = fileName.split('.').pop()?.toLowerCase();
		switch (extension) {
			case 'pdf': return 'text-red-600';
			case 'jpg': case 'jpeg': case 'png': case 'gif': case 'webp': return 'text-green-600';
			case 'mp3': case 'wav': case 'flac': return 'text-purple-600';
			case 'mp4': case 'avi': case 'mov': return 'text-orange-600';
			default: return 'text-gray-700';
		}
	}

	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function previewMaterialFile(file: any) {
		previewFile = {
			id: file.id,
			name: file.name,
			type: 'file',
			path: file.path,
			size: file.size,
			mimeType: file.type || '',
			createdAt: new Date(file.createdAt),
			updatedAt: new Date(file.updatedAt)
		};
		showPreview = true;
	}

	async function downloadMaterialFile(fileId: number, fileName: string) {
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
			} else {
				alert('Download error');
			}
		} catch (err) {
			alert('Download error');
		}
	}

	async function deleteMaterialFile(fileId: number, fileName: string) {
		if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
			return;
		}
		try {
			const response = await fetch(`/api/files/${fileId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				await loadMaterialsForPiece(selectedPiece);
				dispatch('materialsUpdated');
			} else {
				alert('Error deleting file');
			}
		} catch (err) {
			alert('Error deleting file');
		}
	}

	function openUploader(material: any) {
		selectedMaterialForUpload = material;
		showUploader = true;
	}

	async function handleFileUpload(files: FileList) {
		if (!selectedMaterialForUpload) return;

		const formData = new FormData();
		Array.from(files).forEach(file => {
			formData.append('files', file);
		});

		try {
			const response = await fetch(`/api/materials/${selectedMaterialForUpload.id}/files`, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				await loadMaterialsForPiece(selectedPiece);
				showUploader = false;
				selectedMaterialForUpload = null;
				dispatch('materialsUpdated');
			} else {
				const error = await response.json();
				alert('Upload error: ' + (error.message || 'Unknown error'));
			}
		} catch (err) {
			alert('Error uploading files');
		}
	}

	function getPieceName(piece: any): string {
		return `${piece.name} - ${piece.composer?.shortName || piece.composer?.longName || ''}`;
	}

	function goBackToPieces() {
		selectedPiece = null;
		materials = [];
		selectedMaterials = {};
		expandedMaterials = new Set();
	}

	function getSelectedMaterial(pieceId: number): any | null {
		const materialId = selectedMaterials[pieceId];
		if (!materialId) return null;
		return materials.find(m => m.id === materialId) || null;
	}

	function toggleMaterialExpansion(materialId: number) {
		if (expandedMaterials.has(materialId)) {
			expandedMaterials.delete(materialId);
		} else {
			expandedMaterials.add(materialId);
		}
		expandedMaterials = new Set(expandedMaterials);
	}

	$: gridCols = isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3';
</script>

<div class="space-y-{isMobile ? '3' : '4'} {isMobile ? 'px-1' : ''} overflow-hidden">
	{#if isLoading}
		<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
			<div class="flex justify-center items-center h-64">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B9AD9]"></div>
				<span class="ml-4 text-gray-600 font-semibold">Loading pieces...</span>
			</div>
		</div>
	{:else if !selectedPiece}
		<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-{isMobile ? '3' : '6'}">
			<div class="flex items-center space-x-3 mb-{isMobile ? '4' : '6'}">
				<div class="flex items-center justify-center w-10 h-10 bg-[#6B9AD9] rounded-[8px]">
					<Package class="w-5 h-5 text-white" />
				</div>
				<div>
					<h1 class="font-bold text-lg">SCORE MANAGEMENT</h1>
					<p class="text-sm text-gray-600">Select a piece to manage its materials</p>
				</div>
			</div>

			{#if pieces.length === 0}
				<div class="text-center py-{isMobile ? '8' : '12'}">
					<div class="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-[8px] mx-auto mb-4">
						<Music class="text-gray-400" size={isMobile ? 32 : 48} />
					</div>
					<h3 class="font-bold text-lg text-gray-700 mb-2">
						{#if projectId}NO PIECES IN THIS PROJECT{:else}NO PIECES FOUND{/if}
					</h3>
					<p class="text-gray-500 {isMobile ? 'text-sm' : ''}">
						{#if projectId}Add pieces to this project to manage their materials{:else}Create pieces first to manage their materials{/if}
					</p>
				</div>
			{:else}
				<div class="grid {gridCols} gap-{isMobile ? '3' : '4'}">
					{#each pieces as piece}
						<Button
							class="p-{isMobile ? '4' : '6'} bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 rounded-[10px] hover:border-[#6B9AD9] transition-all duration-300 text-left w-full group"
							on:click={() => loadMaterialsForPiece(piece)}
						>
							<div class="flex items-center gap-{isMobile ? '3' : '4'}">
								<div class="p-{isMobile ? '2' : '3'} bg-blue-500 text-white rounded-[8px] group-hover:scale-110 transition-transform flex-shrink-0">
									<Music size={isMobile ? 20 : 24} />
								</div>
								<div class="flex-1 min-w-0 text-left">
									<h3 class="font-bold {isMobile ? 'text-base' : 'text-lg'} text-gray-700 truncate">{piece.name}</h3>
									<p class="text-{isMobile ? 'xs' : 'sm'} text-gray-500 truncate">
										{piece.composer?.shortName || piece.composer?.longName || 'Unknown composer'}
									</p>
									{#if piece.opus && !isMobile}
										<p class="text-xs text-gray-400">Op. {piece.opus}</p>
									{/if}
								</div>
							</div>
						</Button>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-{isMobile ? '3' : '4'} overflow-hidden">
			<div class="flex {isMobile ? 'flex-col' : 'items-center justify-between'} mb-{isMobile ? '4' : '6'} gap-{isMobile ? '3' : '4'}">
				<div class="flex items-center gap-3 {isMobile ? 'flex-wrap' : ''}">
					<Button
						class="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-300 transition-colors font-semibold {isMobile ? 'text-sm' : ''}"
						on:click={goBackToPieces}
					>
						← Back to Pieces
					</Button>
					{#if !isMobile}
						<div class="h-6 w-px bg-gray-300"></div>
					{/if}
					<div>
						<h2 class="font-bold text-lg text-gray-700">MATERIALS & SELECTION</h2>
						<p class="text-sm text-gray-500 break-words">{getPieceName(selectedPiece)}</p>

						{#if selectedPiece}
							{@const currentSelectedMaterial = getSelectedMaterial(selectedPiece.id)}
							{#if currentSelectedMaterial}
								<div class="mt-2 flex items-center gap-2 text-sm {isMobile ? 'justify-start' : ''}">
									<CheckCircle class="text-green-600" size={16} />
									<span class="text-green-600 font-medium break-words">
           Selected: {currentSelectedMaterial.name}
          </span>
								</div>
							{:else}
								<div class="mt-2 flex items-center gap-2 text-sm {isMobile ? 'justify-start' : ''}">
									<Circle class="text-orange-600" size={16} />
									<span class="text-orange-600 font-medium">
           No material selected
          </span>
								</div>
							{/if}
						{/if}
					</div>
				</div>

				<Button
					class="flex items-center gap-2 px-{isMobile ? '4' : '6'} py-3 bg-[#6B9AD9] text-white rounded-lg hover:bg-blue-600 border-2 border-blue-600 transition-colors font-semibold {isMobile ? 'justify-center w-full' : ''}"
					on:click={() => showCreateForm = true}
				>
					<Plus size={20} />
					<span class="{isMobile ? 'text-sm' : ''}">New Material</span>
				</Button>
			</div>
		</div>

		{#if materials.length === 0}
			<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
				<div class="text-center py-{isMobile ? '8' : '12'}">
					<div class="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-[8px] mx-auto mb-4">
						<Package class="text-gray-400" size={isMobile ? 32 : 48} />
					</div>
					<h3 class="font-bold text-lg text-gray-700 mb-2">NO MATERIALS CREATED</h3>
					<p class="text-gray-500 {isMobile ? 'text-sm' : ''} mb-4">Create the first material for this piece</p>
					<Button
						class="flex items-center gap-2 px-6 py-3 bg-[#6B9AD9] text-white rounded-lg hover:bg-blue-600 border-2 border-blue-600 transition-colors font-semibold {isMobile ? 'w-full justify-center' : 'mx-auto'}"
						on:click={() => showCreateForm = true}
					>
						<Plus size={20} />
						<span class="{isMobile ? 'text-sm' : ''}">Create First Material</span>
					</Button>
				</div>
			</div>
		{:else}
			<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
				<div class="flex items-center space-x-3 mb-6">
					<div class="flex items-center justify-center w-10 h-10 bg-[#6B9AD9] rounded-[8px]">
						<Package class="w-5 h-5 text-white" />
					</div>
					<div>
						<h1 class="font-bold text-lg">MATERIALS & FILES ({materials.length})</h1>
						<p class="text-sm text-gray-600">Click on items to manage or upload files</p>
					</div>
				</div>

				<div class="space-y-{isMobile ? '3' : '4'}">
					{#each materials as material}
						{@const isSelected = selectedMaterials[selectedPiece.id] === material.id}
						{@const isExpanded = expandedMaterials.has(material.id)}

						<div class="border-2 border-[#8C8C8C] rounded-[10px] overflow-hidden hover:bg-gray-50 transition-all duration-200 {
        isSelected ? 'ring-2 ring-blue-500 bg-blue-50' :
        material.is_default ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''
       }">
							<div class="flex items-center justify-between p-{isMobile ? '3' : '4'} cursor-pointer group">
								<div class="flex items-center gap-{isMobile ? '3' : '4'} flex-1 min-w-0">
									<div class="flex-shrink-0">
										<Button
											class="p-1 hover:bg-gray-100 rounded transition-colors"
											on:click={() => selectMaterial(selectedPiece.id, isSelected ? null : material.id)}
											title={isSelected ? 'Deselect this material' : 'Select this material'}
										>
											{#if isSelected}
												<CheckCircle class="text-blue-600" size={isMobile ? 20 : 24} />
											{:else}
												<Circle class="text-gray-400" size={isMobile ? 20 : 24} />
											{/if}
										</Button>
									</div>

									<div class="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-[8px] border-2 border-gray-300 group-hover:border-[#6B9AD9] transition-colors flex items-center justify-center">
										<Package size={isMobile ? 20 : 24} class="text-purple-600" />
									</div>

									<div class="flex-1 min-w-0 overflow-hidden">
										<div class="flex {isMobile ? 'flex-col' : 'items-center justify-between'} mb-2">
											<div class="flex items-center gap-2">
												<h3 class="font-bold text-gray-900 truncate" title={material.name}>{material.name}</h3>
												{#if material.is_default}
													<Star class="text-yellow-500 fill-current" size={14} />
												{/if}
												{#if isSelected}
													<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">✓ Selected</span>
												{/if}
											</div>
											{#if !isMobile}
												<div class="flex items-center gap-2 text-xs">
              <span class="bg-purple-100 text-purple-800 px-2 py-1 rounded font-semibold border border-purple-300">
               {material.files_count || 0} file{material.files_count !== 1 ? 's' : ''}
              </span>
												</div>
											{/if}
										</div>

										<div class="grid grid-cols-1 {isMobile ? 'gap-1' : 'md:grid-cols-3 gap-4'} text-sm overflow-hidden">
											<div class="min-w-0">
												<span class="font-medium text-gray-700">Type:</span>
												<span class="text-gray-600 {isMobile ? 'ml-2' : 'block'} break-words">
              Material
													{#if material.edition}• {material.edition}{/if}
             </span>
											</div>
											<div class="min-w-0">
												<span class="font-medium text-gray-700">Created:</span>
												<span class="text-gray-600 {isMobile ? 'ml-2' : 'block'}">{formatDate(material.createdAt)}</span>
											</div>
											<div class="min-w-0">
												<span class="font-medium text-gray-700">Files:</span>
												<span class="text-green-600 font-semibold {isMobile ? 'ml-2' : 'block'}">
              {material.files_count || 0} file{material.files_count !== 1 ? 's' : ''}
													{#if material.files_count > 0}✓{/if}
             </span>
											</div>
										</div>
									</div>
								</div>

								<!-- CORRECTION : Gestion de l'événement et du stopPropagation via la fonction -->
								<div class="flex items-center gap-2 flex-shrink-0">
									<Button
										class="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-300 transition-colors"
										on:click={(e) => { e.stopPropagation(); openUploader(material); }}
										title="Upload Files"
									>
										<Upload size={16} />
									</Button>

									<Button
										class="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-300 transition-colors"
										on:click={(e) => { e.stopPropagation(); deleteMaterial(material); }}
										title="Delete"
									>
										<Trash2 size={16} />
									</Button>
								</div>
							</div>

							{#if material.files && material.files.length > 0}
								<div class="border-t-2 border-gray-300 bg-gradient-to-r from-purple-50 to-blue-50 overflow-hidden">
									<div class="p-{isMobile ? '3' : '4'}">
										<div class="flex {isMobile ? 'flex-col' : 'items-center justify-between'} mb-4 gap-2">
											<h4 class="text-{isMobile ? 'sm' : 'base'} font-bold text-gray-700 flex items-center gap-2">
												<FileText size={isMobile ? 14 : 16} class="text-purple-600" />
												MATERIAL FILES ({material.files.length})
											</h4>

											<div class="flex items-center gap-2">
             <span class="text-xs text-green-600 bg-green-100 px-3 py-1 rounded-lg font-bold border border-green-300">
              ✓ {material.files.length} file{material.files.length !== 1 ? 's' : ''}
             </span>
												{#if !isMobile}
													<Button
														class="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 p-1"
														on:click={() => toggleMaterialExpansion(material.id)}
													>
														{#if isExpanded}<ChevronDown size={16} />{:else}<ChevronRight size={16} />{/if}
													</Button>
												{/if}
											</div>
										</div>

										{#if isMobile || isExpanded}
											<div class="space-y-{isMobile ? '2' : '3'} overflow-hidden">
												{#each material.files as file}
													<div class="flex items-center justify-between p-{isMobile ? '2' : '3'} bg-white border-2 border-gray-300 rounded-[8px] hover:border-purple-400 transition-colors group min-w-0">
														<div class="flex items-center gap-{isMobile ? '2' : '3'} flex-1 min-w-0">
															<div class="w-8 h-8 bg-gray-100 rounded-[6px] border border-gray-300 flex items-center justify-center flex-shrink-0">
																<svelte:component
																	this={getFileIcon(file.name)}
																	size={isMobile ? 14 : 16}
																	class={getFileColor(file.name)}
																/>
															</div>
															<div class="flex-1 min-w-0">
																<span class="text-{isMobile ? 'xs' : 'sm'} font-bold text-gray-700 truncate block" title={file.name}>{file.name}</span>
																<span class="text-xs text-gray-500">{formatFileSize(file.size || 0)}</span>
															</div>
														</div>

														<div class="flex items-center gap-1 flex-shrink-0">
															<Button
																class="p-{isMobile ? '1.5' : '2'} text-gray-600 hover:text-blue-600 rounded-[6px] hover:bg-blue-50 border border-transparent hover:border-blue-300 transition-colors"
																on:click={() => previewMaterialFile(file)}
																title="Preview"
															>
																<Eye size={isMobile ? 12 : 14} />
															</Button>
															<Button
																class="p-{isMobile ? '1.5' : '2'} text-gray-600 hover:text-green-600 rounded-[6px] hover:bg-green-50 border border-transparent hover:border-green-300 transition-colors"
																on:click={() => downloadMaterialFile(file.id, file.name)}
																title="Download"
															>
																<Download size={isMobile ? 12 : 14} />
															</Button>
															<Button
																class="p-{isMobile ? '1.5' : '2'} text-gray-600 hover:text-red-600 rounded-[6px] hover:bg-red-50 border border-transparent hover:border-red-300 transition-colors"
																on:click={() => deleteMaterialFile(file.id, file.name)}
																title="Delete"
															>
																<X size={isMobile ? 12 : 14} />
															</Button>
														</div>
													</div>
												{/each}
											</div>

											<div class="mt-4 pt-3 border-t border-gray-200">
												<Button
													class="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-md {isMobile ? 'w-full justify-center' : ''}"
													on:click={() => openUploader(material)}
												>
													<CloudUpload size={16} />
													<span class="font-medium {isMobile ? 'text-sm' : ''}">Add More Files</span>
												</Button>
											</div>
										{/if}
									</div>
								</div>
							{:else}
								<div class="border-t-2 border-gray-300 bg-gray-50 overflow-hidden">
									<div class="p-{isMobile ? '4' : '6'} text-center">
										<FileText class="mx-auto mb-3 text-gray-400" size={isMobile ? 24 : 32} />
										<p class="text-{isMobile ? 'xs' : 'sm'} font-bold text-gray-600 mb-2">NO FILES IN THIS MATERIAL</p>
										<p class="text-xs text-gray-400 mb-4">Upload files to this material</p>
										<Button
											class="flex items-center gap-2 px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-blue-600 border-2 border-blue-600 transition-colors font-semibold {isMobile ? 'w-full justify-center' : 'mx-auto'}"
											on:click={() => openUploader(material)}
										>
											<Upload size={16} />
											<span class="{isMobile ? 'text-sm' : ''}">Upload Files</span>
										</Button>
									</div>
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	{/if}
</div>

{#if showCreateForm}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-{isMobile ? '2' : '4'}">
		<div class="bg-[#E7E7E7] rounded-[10px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
			<div class="bg-white border-2 border-[#8C8C8C] rounded-t-[10px] p-4">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 bg-[#6B9AD9] rounded-[8px] flex items-center justify-center">
							<Plus size={20} class="text-white" />
						</div>
						<div>
							<h1 class="font-bold text-lg">NEW MATERIAL</h1>
							<p class="text-sm text-gray-600">Create material for "{selectedPiece?.name}"</p>
						</div>
					</div>
					<Button
						class="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-300 transition-colors"
						on:click={() => showCreateForm = false}
					>
						<X size={20} />
					</Button>
				</div>
			</div>

			<div class="p-4 space-y-4">
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
					<div class="space-y-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Material Name *</label>
							<input type="text" bind:value={newMaterialData.name} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent transition-colors" placeholder="e.g. Main material, Concert version" required />
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
							<textarea bind:value={newMaterialData.description} rows={isMobile ? "2" : "3"} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent transition-colors resize-vertical" placeholder="Material description..."></textarea>
						</div>
						<div class="grid grid-cols-1 {isMobile ? '' : 'md:grid-cols-2'} gap-4">
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Edition</label>
								<input type="text" bind:value={newMaterialData.edition} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent transition-colors" placeholder="e.g. Urtext, Peters" />
							</div>
							<div>
								<label class="block text-sm font-medium text-gray-700 mb-2">Publisher</label>
								<input type="text" bind:value={newMaterialData.editor} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent transition-colors" placeholder="Publishing house" />
							</div>
						</div>
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
							<textarea bind:value={newMaterialData.notes} rows={isMobile ? "2" : "3"} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent transition-colors resize-vertical" placeholder="Bowings, modifications..."></textarea>
						</div>
						<label class="flex items-center">
							<input type="checkbox" bind:checked={newMaterialData.is_default} class="w-4 h-4 text-[#6B9AD9] bg-gray-100 border-gray-300 rounded focus:ring-[#6B9AD9] focus:ring-2" />
							<span class="ml-2 text-sm text-gray-700">Set as default material for this piece</span>
						</label>
					</div>
				</div>

				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
					<div class="flex {isMobile ? 'flex-col gap-3' : 'justify-between items-center'}">
						<div class="text-sm text-gray-600 font-semibold">Material will be created for "{selectedPiece?.name}"</div>
						<div class="flex {isMobile ? 'flex-col w-full gap-2' : 'gap-3'}">
							<Button class="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-300 transition-colors font-semibold {isMobile ? 'w-full justify-center' : ''}" on:click={() => showCreateForm = false}>
								Cancel
							</Button>
							<Button class="px-6 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-blue-600 border-2 border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-semibold {isMobile ? 'w-full' : ''}" disabled={!newMaterialData.name.trim()} on:click={createMaterial}>
								<Plus size={16} /> Create Material
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

{#if showUploader && selectedMaterialForUpload}
	<FileUploader
		on:upload={(e) => handleFileUpload(e.detail)}
		on:cancel={() => {
    showUploader = false;
    selectedMaterialForUpload = null;
   }}
	/>
{/if}

{#if showPreview && previewFile}
	<FilePreview
		fileId={previewFile.id}
		fileName={previewFile.name}
		fileType={previewFile.mimeType || ''}
		onClose={() => {
    showPreview = false;
    previewFile = null;
   }}
	/>
{/if}

<style>
    @media (max-width: 768px) {
        :global(.md\:grid-cols-3) { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        :global(.md\:grid-cols-2) { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        :global(.space-y-4) > :not([hidden]) ~ :not([hidden]) { margin-top: 0.75rem; }
        :global(.space-y-3) > :not([hidden]) ~ :not([hidden]) { margin-top: 0.5rem; }
        :global(.space-y-2) > :not([hidden]) ~ :not([hidden]) { margin-top: 0.5rem; }
        :global(.gap-4) { gap: 0.75rem; }
        :global(.gap-3) { gap: 0.5rem; }
        :global(.gap-2) { gap: 0.25rem; }
        :global(button) { min-height: 44px; }
        .group:hover { transform: none; }
        .group-hover\:scale-110 { transition: none; }
        .break-words { word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; }
        .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .min-w-0 { min-width: 0; }
        .overflow-hidden { overflow: hidden; }
    }
    @media (min-width: 769px) and (max-width: 1024px) {
        :global(.lg\:grid-cols-3) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        :global(.md\:grid-cols-3) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    .break-words { word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; }
    :global(button), .group { transition: all 200ms ease-in-out; }
    .fixed.inset-0 { display: flex; align-items: center; justify-content: center; }
</style>