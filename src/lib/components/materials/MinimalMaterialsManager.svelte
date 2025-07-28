<!-- src/lib/components/materials/MinimalMaterialsManager.svelte - Mobile optimized with visible files -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import {
		Package,
		Plus,
		Music,
		FileText,
		Trash2,
		Star,
		Edit3,
		Upload,
		CheckCircle,
		Circle,
		Eye,
		Download,
		X,
		ChevronDown,
		ChevronRight
	} from 'lucide-svelte';
	import { browser } from '$app/environment';

	const dispatch = createEventDispatcher();

	export let projectId: number | null = null;

	let materials: any[] = [];
	let pieces: any[] = [];
	let selectedPiece: any = null;
	let isLoading = true;
	let showCreateForm = false;
	let isMobile = false;
	let isTablet = false;
	let windowWidth = 0;
	let expandedMaterials = new Set<number>(); // Track which materials show files
	let newMaterialData = {
		name: '',
		description: '',
		edition: '',
		editor: '',
		notes: '',
		is_default: false
	};

	// State for selected materials per piece
	let selectedMaterials: Record<number, number | null> = {};

	// Enhanced responsive detection
	const checkResponsive = () => {
		if (browser) {
			windowWidth = window.innerWidth;
			isMobile = window.innerWidth <= 768;
			isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
		}
	};

	onMount(async () => {
		checkResponsive();
		if (browser) {
			window.addEventListener('resize', checkResponsive);
		}

		await loadPieces();
		isLoading = false;

		return () => {
			if (browser) {
				window.removeEventListener('resize', checkResponsive);
			}
		};
	});

	async function loadPieces() {
		try {
			const response = await fetch('/api/pieces?limit=1000&page=1&filter=&orderBy=name&order=asc');
			if (response.ok) {
				const data = await response.json();
				pieces = data.data || data || [];
				console.log('✅ Loaded pieces:', pieces.length);
			}
		} catch (error) {
			console.error('Error loading pieces:', error);
		}
	}

	async function loadMaterialsForPiece(piece: any) {
		try {
			selectedPiece = piece;
			console.log(`🔄 Loading materials for piece: ${piece.name}`);

			// 1. Load piece materials
			const response = await fetch(`/api/materials/piece/${piece.id}`);
			if (response.ok) {
				const materialsData = await response.json();
				console.log(`📦 Loaded ${materialsData.length} materials from API`);

				// Load actual files for each material
				const materialPromises = materialsData.map(async (material) => {
					try {
						const originalCount = material.files_count || material.files?.length || 0;
						const filesResponse = await fetch(`/api/materials/${material.id}/files`);
						if (filesResponse.ok) {
							const files = await filesResponse.json();
							material.files = Array.isArray(files) ? files : [];
							material.files_count = material.files.length;
						} else {
							material.files_count = originalCount;
							material.files = material.files || [];
						}
						return material;
					} catch (error) {
						console.error(`Error loading files for material ${material.id}:`, error);
						material.files_count = material.files_count || material.files?.length || 0;
						return material;
					}
				});

				materials = await Promise.all(materialPromises);
				materials = [...materials];

				// Auto-expand materials with files on mobile
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

			// 2. Load selected material for this piece
			await loadSelectedMaterialForPiece(piece.id);

		} catch (error) {
			console.error('Error loading materials for piece:', piece.id, error);
			materials = [];
		}
	}

	// Load selected material for a piece with better error handling
	async function loadSelectedMaterialForPiece(pieceId: number) {
		try {
			console.log(`🔍 Loading selected material for piece ${pieceId}`);
			const response = await fetch(`/api/pieces/${pieceId}/select-material`);
			if (response.ok) {
				const result = await response.json();
				selectedMaterials[pieceId] = result.materialId;
				console.log(`✅ Selected material for piece ${pieceId}:`, result.materialId);
			} else {
				console.log(`❌ No selected material found for piece ${pieceId}`);
				selectedMaterials[pieceId] = null;
			}
			selectedMaterials = { ...selectedMaterials }; // Force reactivity
		} catch (error) {
			console.error('Error loading selected material for piece:', pieceId, error);
			selectedMaterials[pieceId] = null;
			selectedMaterials = { ...selectedMaterials };
		}
	}

	// Select a material for a piece with better feedback
	async function selectMaterial(pieceId: number, materialId: number | null) {
		try {
			console.log(`🎯 Selecting material ${materialId} for piece ${pieceId}`);
			const response = await fetch(`/api/pieces/${pieceId}/select-material`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ materialId })
			});

			if (response.ok) {
				selectedMaterials[pieceId] = materialId;
				selectedMaterials = { ...selectedMaterials };
				console.log('✅ Material selection updated successfully');

				// Dispatch event to notify other components
				dispatch('materialsUpdated');

				// Force reload in all components
				window.dispatchEvent(new CustomEvent('materialSelectionChanged', {
					detail: { pieceId, materialId }
				}));
			} else {
				const errorData = await response.json();
				console.error('❌ Error selecting material:', errorData);
				alert('Error selecting material: ' + (errorData.message || 'Unknown error'));
			}
		} catch (error) {
			console.error('❌ Error selecting material:', error);
			alert('Error selecting material');
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
				const newMaterial = await response.json();
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

				// Auto-select the new material if it's set as default
				if (newMaterial.is_default) {
					await selectMaterial(selectedPiece.id, newMaterial.id);
				}
			} else {
				const error = await response.json();
				alert('Creation error: ' + (error.message || 'Unknown error'));
			}
		} catch (error) {
			console.error('Error creating material:', error);
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
				// If this was the selected material, unselect it
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
		} catch (error) {
			console.error('Error deleting material:', error);
			alert('Error deleting material');
		}
	}

	async function deleteMaterialFile(fileId: number, fileName: string) {
		if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
			return;
		}

		try {
			console.log('🗑️ Deleting file:', fileId, fileName);
			const response = await fetch(`/api/files/${fileId}`, {
				method: 'DELETE'
			});

			if (response.ok) {
				console.log('✅ File deleted successfully');
				// Reload materials for current piece
				if (selectedPiece) {
					await loadMaterialsForPiece(selectedPiece);
				}
				dispatch('materialsUpdated');
			} else {
				console.error('❌ Delete failed:', response.status);
				alert('Error deleting file');
			}
		} catch (error) {
			console.error('❌ Error deleting file:', error);
			alert('Error deleting file');
		}
	}

	async function downloadMaterialFile(fileId: number, fileName: string) {
		try {
			console.log('📥 Downloading file:', fileId, fileName);
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
				console.log('✅ Download completed');
			} else {
				console.error('❌ Download failed:', response.status);
				alert('Download error');
			}
		} catch (error) {
			console.error('❌ Error downloading file:', error);
			alert('Download error');
		}
	}

	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString('en-US', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
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

	// File upload
	async function handleFileUpload(material: any, event: Event) {
		const input = event.target as HTMLInputElement;
		if (!input.files || input.files.length === 0) return;

		const formData = new FormData();
		Array.from(input.files).forEach(file => {
			formData.append('files', file);
		});

		try {
			console.log('📤 Uploading files to material:', material.name);
			const response = await fetch(`/api/materials/${material.id}/files`, {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				console.log('✅ Upload successful!');
				await loadMaterialsForPiece(selectedPiece);
				dispatch('materialsUpdated');
			} else {
				const error = await response.json();
				console.error('❌ Upload failed:', error);
				alert('Upload error: ' + (error.message || 'Unknown error'));
			}
		} catch (error) {
			console.error('❌ Error uploading files:', error);
			alert('Error uploading files');
		}

		// Reset input
		input.value = '';
	}

	// Get selected material with proper logging
	function getSelectedMaterial(pieceId: number): any | null {
		const materialId = selectedMaterials[pieceId];
		if (!materialId) {
			console.log(`❌ No material selected for piece ${pieceId}`);
			return null;
		}
		const material = materials.find(m => m.id === materialId) || null;
		console.log(`✅ Selected material for piece ${pieceId}:`, material?.name || 'Not found');
		return material;
	}

	// Toggle material file expansion
	function toggleMaterialExpansion(materialId: number) {
		if (expandedMaterials.has(materialId)) {
			expandedMaterials.delete(materialId);
		} else {
			expandedMaterials.add(materialId);
		}
		expandedMaterials = new Set(expandedMaterials);
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

	// Dynamic grid for responsive design
	$: gridCols = isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3';
</script>

<div class="space-y-{isMobile ? '3' : '6'} {isMobile ? 'px-1' : ''}">
	{#if isLoading}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B9AD9]"></div>
		</div>
	{:else if !selectedPiece}
		<!-- Piece selection - Mobile optimized -->
		<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-{isMobile ? '3' : '6'}">
			<div class="mb-{isMobile ? '4' : '6'}">
				<h2 class="text-{isMobile ? 'lg' : '2xl'} font-bold text-gray-700 uppercase {isMobile ? 'text-center' : ''}">MATERIAL MANAGEMENT</h2>
				<p class="text-gray-500 mt-1 {isMobile ? 'text-sm text-center' : ''}">Select a piece to manage its materials</p>
			</div>

			{#if pieces.length === 0}
				<div class="text-center py-8">
					<Music class="mx-auto mb-4 text-gray-400" size={isMobile ? 32 : 48} />
					<p class="text-gray-500 {isMobile ? 'text-sm' : ''}">No pieces available</p>
				</div>
			{:else}
				<div class="grid {gridCols} gap-{isMobile ? '2' : '4'}">
					{#each pieces as piece}
						<button
							class="p-{isMobile ? '3' : '4'} bg-gradient-to-br from-white to-gray-50 border-2 border-[#E7E7E7] rounded-xl hover:border-[#6B9AD9] transition-all duration-300 text-left group"
							on:click={() => loadMaterialsForPiece(piece)}
						>
							<div class="flex items-center gap-{isMobile ? '2' : '3'}">
								<div class="p-{isMobile ? '2' : '3'} bg-blue-500 text-white rounded-lg group-hover:scale-110 transition-transform">
									<Music size={isMobile ? 16 : 24} />
								</div>
								<div class="flex-1 min-w-0">
									<h3 class="font-semibold {isMobile ? 'text-sm' : 'text-lg'} text-gray-700 truncate">{piece.name}</h3>
									<p class="text-{isMobile ? 'xs' : 'sm'} text-gray-500 truncate">
										{piece.composer?.shortName || piece.composer?.longName || 'Unknown composer'}
									</p>
									{#if piece.opus && !isMobile}
										<p class="text-xs text-gray-400">Op. {piece.opus}</p>
									{/if}
								</div>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<!-- Material management with corrected selection display and visible files -->
		<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-{isMobile ? '3' : '6'}">
			<div class="flex {isMobile ? 'flex-col' : 'items-center justify-between'} mb-{isMobile ? '4' : '6'} gap-{isMobile ? '3' : '4'}">
				<div>
					<button
						class="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-2 {isMobile ? 'text-sm' : ''}"
						on:click={goBackToPieces}
					>
						← Back to Pieces
					</button>
					<h2 class="text-{isMobile ? 'lg' : '2xl'} font-bold text-gray-700 uppercase {isMobile ? 'text-center' : ''}">MATERIALS & SELECTION</h2>
					<p class="text-gray-500 mt-1 {isMobile ? 'text-sm text-center' : ''}">{getPieceName(selectedPiece)}</p>

					<!-- Selection status with proper reactivity -->
					{#if selectedPiece}
						{@const currentSelectedMaterial = getSelectedMaterial(selectedPiece.id)}
						{#if currentSelectedMaterial}
							<div class="mt-2 flex items-center gap-2 text-sm {isMobile ? 'justify-center' : ''}">
								<CheckCircle class="text-green-600" size={16} />
								<span class="text-green-600 font-medium">
									Selected Material: {currentSelectedMaterial.name}
								</span>
							</div>
						{:else}
							<div class="mt-2 flex items-center gap-2 text-sm {isMobile ? 'justify-center' : ''}">
								<Circle class="text-orange-600" size={16} />
								<span class="text-orange-600 font-medium">
									No material selected
								</span>
							</div>
						{/if}
					{/if}
				</div>

				<button
					class="flex items-center gap-2 px-{isMobile ? '4' : '6'} py-3 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors font-semibold {isMobile ? 'justify-center w-full' : ''}"
					on:click={() => showCreateForm = true}
				>
					<Plus size={20} />
					<span class="{isMobile ? 'text-sm' : ''}">New Material</span>
				</button>
			</div>

			<!-- Materials list with selection and visible files -->
			{#if materials.length === 0}
				<div class="text-center py-8">
					<Package class="mx-auto mb-4 text-gray-400" size={isMobile ? 32 : 48} />
					<p class="text-gray-500 mb-4 {isMobile ? 'text-sm' : ''}">No materials created for this piece</p>
					<button
						class="text-[#6B9AD9] hover:underline {isMobile ? 'text-sm' : ''}"
						on:click={() => showCreateForm = true}
					>
						Create the first material
					</button>
				</div>
			{:else}
				<div class="space-y-{isMobile ? '3' : '4'}">
					{#each materials as material}
						{@const isSelected = selectedMaterials[selectedPiece.id] === material.id}
						{@const isExpanded = expandedMaterials.has(material.id)}

						<div class="border border-gray-200 rounded-lg p-{isMobile ? '3' : '4'} hover:border-[#6B9AD9] transition-all duration-200 {
							isSelected ? 'ring-2 ring-blue-500 bg-blue-50' :
							material.is_default ? 'ring-2 ring-yellow-400 ring-opacity-50' : 'bg-white'
						}">
							<div class="flex items-start justify-between">
								<div class="flex items-start gap-{isMobile ? '3' : '4'} flex-1">
									<!-- Selection checkbox -->
									<div class="pt-1">
										<button
											class="p-1 hover:bg-gray-100 rounded transition-colors"
											on:click={() => selectMaterial(selectedPiece.id, isSelected ? null : material.id)}
											title={isSelected ? 'Deselect this material' : 'Select this material'}
										>
											{#if isSelected}
												<CheckCircle class="text-blue-600" size={isMobile ? 20 : 24} />
											{:else}
												<Circle class="text-gray-400" size={isMobile ? 20 : 24} />
											{/if}
										</button>
									</div>

									<div class="flex-1 min-w-0">
										<div class="flex {isMobile ? 'flex-col' : 'items-center'} gap-2 mb-2">
											<h3 class="text-{isMobile ? 'base' : 'lg'} font-semibold text-gray-800">{material.name}</h3>
											<div class="flex items-center gap-2 {isMobile ? '' : 'ml-auto'}">
												{#if material.is_default}
													<Star class="text-yellow-500 fill-current" size={14} />
													<span class="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Default</span>
												{/if}
												{#if isSelected}
													<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">✓ Selected</span>
												{/if}
											</div>
										</div>

										{#if material.description && !isMobile}
											<p class="text-sm text-gray-600 mb-3">{material.description}</p>
										{/if}

										<div class="grid grid-cols-1 {isMobile ? 'gap-1' : 'md:grid-cols-4 gap-4'} text-sm mb-3">
											{#if material.edition}
												<div>
													<span class="font-medium text-gray-700">Edition:</span>
													<p class="text-gray-600 {isMobile ? 'inline ml-1' : ''}">{material.edition}</p>
												</div>
											{/if}
											{#if material.editor}
												<div>
													<span class="font-medium text-gray-700">Publisher:</span>
													<p class="text-gray-600 {isMobile ? 'inline ml-1' : ''}">{material.editor}</p>
												</div>
											{/if}
											<div>
												<span class="font-medium text-gray-700">Created:</span>
												<p class="text-gray-600 {isMobile ? 'inline ml-1' : ''}">{formatDate(material.createdAt)}</p>
											</div>
											<div>
												<span class="font-medium text-gray-700">Files:</span>
												<p class="text-gray-600 font-semibold {material.files_count > 0 ? 'text-green-600' : 'text-orange-600'} {isMobile ? 'inline ml-1' : ''}">
													{material.files_count || 0}
													{#if material.files_count > 0}
														<span class="text-xs text-green-500">✓</span>
													{:else}
														<span class="text-xs text-orange-500">⚠</span>
													{/if}
												</p>
											</div>
										</div>

										<!-- Files section - Always visible or expandable -->
										{#if material.files && material.files.length > 0}
											<div class="border-t pt-3">
												<div class="flex items-center justify-between mb-2">
													<h4 class="text-{isMobile ? 'sm' : 'sm'} font-medium text-gray-700">Files ({material.files.length})</h4>
													{#if !isMobile}
														<button
															class="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
															on:click={() => toggleMaterialExpansion(material.id)}
														>
															{#if isExpanded}
																<ChevronDown size={14} />
																Hide
															{:else}
																<ChevronRight size={14} />
																Show
															{/if}
														</button>
													{/if}
												</div>

												{#if isMobile || isExpanded}
													<div class="space-y-{isMobile ? '1' : '2'}">
														{#each material.files as file}
															<div class="flex items-center justify-between p-{isMobile ? '2' : '3'} bg-gray-50 rounded hover:bg-gray-100 transition-colors">
																<div class="flex items-center gap-{isMobile ? '2' : '3'} flex-1 min-w-0">
																	<span class="text-lg">{getFileIcon(file.name)}</span>
																	<div class="flex-1 min-w-0">
																		<span class="text-{isMobile ? 'xs' : 'sm'} text-gray-700 truncate block">{file.name}</span>
																		<span class="text-xs text-gray-500">{formatFileSize(file.size || 0)}</span>
																	</div>
																</div>
																<div class="flex items-center gap-1">
																	<button
																		class="p-{isMobile ? '1' : '1.5'} text-gray-600 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
																		on:click={() => window.open(`/api/files/stream/${file.id}`, '_blank')}
																		title="Preview"
																	>
																		<Eye size={isMobile ? 12 : 14} />
																	</button>
																	<button
																		class="p-{isMobile ? '1' : '1.5'} text-gray-600 hover:text-green-600 rounded hover:bg-green-50 transition-colors"
																		on:click={() => downloadMaterialFile(file.id, file.name)}
																		title="Download"
																	>
																		<Download size={isMobile ? 12 : 14} />
																	</button>
																	<button
																		class="p-{isMobile ? '1' : '1.5'} text-gray-600 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
																		on:click={() => deleteMaterialFile(file.id, file.name)}
																		title="Delete"
																	>
																		<X size={isMobile ? 12 : 14} />
																	</button>
																</div>
															</div>
														{/each}
													</div>
												{/if}
											</div>
										{/if}

										{#if material.notes && !isMobile}
											<div class="mt-3 p-2 bg-blue-50 rounded text-sm">
												<span class="font-medium text-blue-800">Notes:</span>
												<span class="text-blue-700">{material.notes}</span>
											</div>
										{/if}
									</div>
								</div>

								<!-- Actions -->
								<div class="flex {isMobile ? 'flex-col' : 'items-center'} gap-{isMobile ? '1' : '2'} ml-{isMobile ? '2' : '4'}">
									<!-- File upload -->
									<input
										type="file"
										multiple
										accept=".pdf,.musicxml,.mxl,.mid,.midi,.jpg,.jpeg,.png,.doc,.docx,.txt,.zip"
										style="display: none;"
										id="upload-{material.id}"
										on:change={(e) => handleFileUpload(material, e)}
									/>
									<button
										class="p-{isMobile ? '1.5' : '2'} text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
										on:click={() => document.getElementById(`upload-${material.id}`)?.click()}
										title="Add files"
									>
										<Upload size={isMobile ? 16 : 18} />
									</button>

									<button
										class="p-{isMobile ? '1.5' : '2'} text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
										on:click={() => deleteMaterial(material)}
										title="Delete"
									>
										<Trash2 size={isMobile ? 16 : 18} />
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Creation modal - Mobile optimized -->
{#if showCreateForm}
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-{isMobile ? '2' : '4'}">
		<div class="bg-white rounded-lg shadow-2xl w-full max-w-{isMobile ? 'sm' : '2xl'} max-h-[90vh] overflow-y-auto">
			<div class="p-{isMobile ? '4' : '6'}">
				<h3 class="text-{isMobile ? 'lg' : 'xl'} font-bold text-gray-800 mb-4">
					New Material for "{selectedPiece?.name}"
				</h3>

				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Material Name *
						</label>
						<input
							type="text"
							bind:value={newMaterialData.name}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent"
							placeholder="e.g. Main material, Concert version"
							required
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Description
						</label>
						<textarea
							bind:value={newMaterialData.description}
							rows={isMobile ? "2" : "3"}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent resize-vertical"
							placeholder="Material description..."
						></textarea>
					</div>

					<div class="grid grid-cols-1 {isMobile ? '' : 'md:grid-cols-2'} gap-4">
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Edition
							</label>
							<input
								type="text"
								bind:value={newMaterialData.edition}
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent"
								placeholder="e.g. Urtext, Peters"
							/>
						</div>

						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Publisher
							</label>
							<input
								type="text"
								bind:value={newMaterialData.editor}
								class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent"
								placeholder="Publishing house"
							/>
						</div>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 mb-2">
							Notes
						</label>
						<textarea
							bind:value={newMaterialData.notes}
							rows={isMobile ? "2" : "3"}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent resize-vertical"
							placeholder="Bowings, modifications..."
						></textarea>
					</div>

					<label class="flex items-center">
						<input
							type="checkbox"
							bind:checked={newMaterialData.is_default}
							class="w-4 h-4 text-[#6B9AD9] bg-gray-100 border-gray-300 rounded focus:ring-[#6B9AD9] focus:ring-2"
						/>
						<span class="ml-2 text-sm text-gray-700">
							Set as default material for this piece
						</span>
					</label>
				</div>

				<div class="flex {isMobile ? 'flex-col' : 'items-center justify-end'} gap-3 mt-6">
					<button
						type="button"
						class="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors {isMobile ? 'w-full' : ''}"
						on:click={() => showCreateForm = false}
					>
						Cancel
					</button>
					<button
						type="button"
						class="px-6 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors {isMobile ? 'w-full' : ''}"
						on:click={createMaterial}
						disabled={!newMaterialData.name.trim()}
					>
						Create
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
    /* Enhanced mobile responsiveness */
    @media (max-width: 768px) {
        :global(.md\:grid-cols-2) {
            grid-template-columns: repeat(1, minmax(0, 1fr));
        }
        :global(.lg\:grid-cols-3) {
            grid-template-columns: repeat(1, minmax(0, 1fr));
        }
        :global(.md\:grid-cols-4) {
            grid-template-columns: repeat(1, minmax(0, 1fr));
        }

        :global(.space-y-6) > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0.75rem;
        }

        :global(.space-y-4) > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0.5rem;
        }

        :global(.space-y-3) > :not([hidden]) ~ :not([hidden]) {
            margin-top: 0.375rem;
        }

        :global(.gap-4) {
            gap: 0.5rem;
        }

        :global(.gap-3) {
            gap: 0.375rem;
        }

        :global(.gap-2) {
            gap: 0.25rem;
        }

        /* Improve touch targets */
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
    }

    /* Tablet adjustments */
    @media (min-width: 769px) and (max-width: 1024px) {
        :global(.lg\:grid-cols-3) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        :global(.md\:grid-cols-4) {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }
    }
</style>