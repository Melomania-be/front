<!-- src/lib/components/filesystem/ProjectFileManager.svelte -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import {
		Music,
		Image,
		Video,
		FileText,
		Folder,
		Plus,
		Upload,
		ChevronLeft,
		Package,
		Database
	} from 'lucide-svelte';
	import type { ProjectFileStructure, FileSystemItem } from '$lib/types/FileSystem';
	import FileSystemExplorer from './FileSystemExplorer.svelte';
	import FileUploader from './FileUploader.svelte';
	import CreateFolderModal from './CreateFolderModal.svelte';
	import MinimalMaterialsManager from '../materials/MinimalMaterialsManager.svelte';
	import { browser } from '$app/environment';

	type FolderCreation = {
		name: string;
		projectId?: number;
		pieceId?: number;
	};

	const dispatch = createEventDispatcher();

	export let project: any;

	let fileStructure: ProjectFileStructure | null = null;
	let currentFolder: FileSystemItem | null = null;
	let isLoading = true;
	let showUploader = false;
	let showCreateFolderModal = false;
	let breadcrumbs: { id: number; name: string }[] = [];
	let activeTab: 'materials' | 'files' = 'materials';
	let isMobile = false;
	let isTablet = false;
	let windowWidth = 0;

	// Extract the projectId from the project
	$: projectId = project?.id || null;

	const defaultFolders = [
		{ name: 'Scores', icon: Music, color: 'bg-green-500' },
		{ name: 'Photos', icon: Image, color: 'bg-blue-500' },
		{ name: 'Videos', icon: Video, color: 'bg-red-500' },
		{ name: 'Documents', icon: FileText, color: 'bg-yellow-500' }
	];

	// Enhanced responsive detection
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
		}

		loadProjectStructure().finally(() => {
			isLoading = false;
		});

		return () => {
			if (browser) {
				window.removeEventListener('resize', checkResponsive);
			}
		};
	});

	async function loadProjectStructure() {
		try {
			const response = await fetch(`/api/filesystem/projects/${project.id}`);
			if (response.ok) {
				fileStructure = await response.json();
			} else {
				await initializeProjectStructure();
			}
		} catch (error) {
			console.error('Error loading project structure:', error);
		}
	}

	async function initializeProjectStructure() {
		try {
			const response = await fetch(`/api/filesystem/projects/${project.id}/init`, {
				method: 'POST'
			});
			if (response.ok) {
				fileStructure = await response.json();
			}
		} catch (error) {
			console.error('Error initializing project structure:', error);
		}
	}

	async function navigateToFolder(folder: FileSystemItem) {
		currentFolder = folder;
		buildBreadcrumbs(folder);

		try {
			const response = await fetch(`/api/filesystem/folders/${folder.id}/contents`);
			if (response.ok) {
				const contents: FileSystemItem[] = await response.json();

				if (folder.name === 'Scores') {
					const enrichedContents = await Promise.all(
						contents.map(async (item: FileSystemItem) => {
							if (item.type === 'folder' && item.pieceId) {
								try {
									const materialsResponse = await fetch(`/api/materials/piece/${item.pieceId}`);
									if (materialsResponse.ok) {
										const materials = await materialsResponse.json();
										item.materials = materials;
									}
								} catch (error) {
									console.error('Error loading materials for piece:', item.pieceId, error);
									item.materials = [];
								}
							}
							return item;
						})
					);

					folder.children = enrichedContents.map((item: FileSystemItem) => ({
						...item,
						updatedAt: new Date(item.updatedAt),
						createdAt: new Date(item.createdAt)
					}));
				} else {
					folder.children = contents.map((item: FileSystemItem) => ({
						...item,
						updatedAt: new Date(item.updatedAt),
						createdAt: new Date(item.createdAt)
					}));
				}

				currentFolder = { ...currentFolder };
			}
		} catch (error) {
			console.error('Error loading folder contents:', error);
		}
	}

	function buildBreadcrumbs(folder: FileSystemItem) {
		breadcrumbs = [];
		let current: FileSystemItem | null = folder;

		while (current) {
			breadcrumbs.unshift({ id: current.id, name: current.name });
			if (current.parentId) {
				break;
			}
			current = null;
		}
	}

	async function createFolder(folderData: FolderCreation) {
		if (!currentFolder) return;

		try {
			const response = await fetch('/api/filesystem/folders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...folderData,
					parentId: currentFolder.id,
					projectId: folderData.projectId || project.id
				})
			});

			if (response.ok) {
				await navigateToFolder(currentFolder);
				showCreateFolderModal = false;
			}
		} catch (error) {
			console.error('Error creating folder:', error);
		}
	}

	function openUploader() {
		showUploader = true;
	}

	function getErrorMessage(error: unknown) {
		return error instanceof Error ? error.message : String(error);
	}

	async function handleUpload(files: FileList) {
		const formData = new FormData();

		if (files.length === 1) {
			formData.append('file', files[0]);
		} else {
			Array.from(files).forEach((file) => {
				formData.append('files', file);
			});
		}

		if (currentFolder) {
			formData.append('parentId', currentFolder.id.toString());
		}
		formData.append('projectId', project.id.toString());

		try {
			const response = await fetch('/api/filesystem/upload', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (response.ok && result.success) {
				if (currentFolder) {
					await navigateToFolder(currentFolder);
				} else {
					await loadProjectStructure();
					if (fileStructure) {
						fileStructure = { ...fileStructure };
					}
				}

				showUploader = false;
			} else {
				console.error('Upload failed:', result.error);
				alert('Upload failed: ' + (result.error || 'Unknown error'));
			}
		} catch (error) {
			console.error('Error uploading files:', error);
			alert('Error uploading files: ' + getErrorMessage(error));
		}
	}

	function goBack() {
		if (breadcrumbs.length > 1) {
			const parentBreadcrumb = breadcrumbs[breadcrumbs.length - 2];
		} else {
			currentFolder = null;
			breadcrumbs = [];
		}
	}

	function handleItemClick(item: FileSystemItem) {
		if (item.type === 'folder') {
			navigateToFolder(item);
		}
	}

	async function handleRefresh() {
		if (currentFolder) {
			await navigateToFolder(currentFolder);
		} else {
			await loadProjectStructure();
			if (fileStructure) {
				fileStructure = { ...fileStructure };
			}
		}
	}

	async function createRootFolder(folderData: FolderCreation) {
		try {
			const response = await fetch('/api/filesystem/folders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...folderData,
					projectId: folderData.projectId || project.id
				})
			});

			if (response.ok) {
				await loadProjectStructure();
				if (fileStructure) {
					fileStructure = { ...fileStructure };
				}
				showCreateFolderModal = false;
			}
		} catch (error) {
			console.error('Error creating root folder:', error);
		}
	}

	async function handleCreateFolder(folderData: FolderCreation) {
		if (currentFolder) {
			await createFolder(folderData);
		} else {
			await createRootFolder(folderData);
		}
	}

	function getFolderByName(name: string): FileSystemItem | null {
		if (!fileStructure || !fileStructure.rootFolder.children) return null;
		return fileStructure.rootFolder.children.find((f) => f.name === name) || null;
	}

	function getFileCount(folder: FileSystemItem | null): number {
		if (!folder?.children) return 0;

		let count = 0;
		for (const child of folder.children) {
			if (child.type === 'file') {
				count++;
			} else if (child.type === 'folder') {
				if (child.children) {
					count += getFileCount(child);
				}

				if (child.materials && child.materials.length > 0) {
					for (const material of child.materials) {
						count += material.files?.length || 0;
					}
				}
			}
		}
		return count;
	}

	function getPieceCount(): number {
		const scoresFolder = getFolderByName('Scores');
		if (!scoresFolder?.children) return 0;
		return scoresFolder.children.filter((item) => item.type === 'folder').length;
	}

	function handleMaterialsUpdated() {
		dispatch('materialsUpdated');
	}

	// Dynamic grid columns based on screen size
	$: gridCols = isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-4';
	$: customGridCols = isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3';
</script>

<!-- Container principal with same style as General Files -->
<div class="bg-[#E7E7E7] p-4 min-h-screen space-y-4">
	{#if isLoading}
		<!-- Loading State -->
		<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
			<div class="flex justify-center items-center h-64">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B9AD9]"></div>
				<span class="ml-4 text-gray-600 font-semibold">Loading project structure...</span>
			</div>
		</div>
	{:else}
		<!-- Tabs Section with same style -->
		<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
			<div class="border-b border-gray-200 mb-6">
				<nav class="flex {isMobile ? 'flex-col space-y-2' : 'space-x-8'}">
					<button
						class="py-2 px-1 border-b-2 font-bold text-{isMobile
							? 'sm'
							: 'sm'} transition-colors {activeTab === 'materials'
							? 'border-[#6B9AD9] text-[#6B9AD9]'
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} {isMobile
							? 'text-center w-full'
							: ''}"
						on:click={() => (activeTab = 'materials')}
					>
						<div class="flex items-center gap-2 {isMobile ? 'justify-center' : ''}">
							<Package size={16} />
							<span class={isMobile ? 'text-sm' : ''}>MATERIAL MANAGEMENT</span>
						</div>
					</button>

					<button
						class="py-2 px-1 border-b-2 font-bold text-{isMobile
							? 'sm'
							: 'sm'} transition-colors {activeTab === 'files'
							? 'border-[#6B9AD9] text-[#6B9AD9]'
							: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} {isMobile
							? 'text-center w-full'
							: ''}"
						on:click={() => (activeTab = 'files')}
					>
						<div class="flex items-center gap-2 {isMobile ? 'justify-center' : ''}">
							<Folder size={16} />
							<span class={isMobile ? 'text-sm' : ''}>FILE STRUCTURE</span>
						</div>
					</button>
				</nav>
			</div>

			{#if activeTab === 'materials'}
				<!-- Materials Manager with projectId -->
				<MinimalMaterialsManager {projectId} on:materialsUpdated={handleMaterialsUpdated} />
			{:else if currentFolder}
				<!-- Folder Navigation with same style as General Files -->
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4 mb-4">
					<div class="flex {isMobile ? 'flex-col' : 'items-center justify-between'} mb-6 gap-4">
						<div class="flex items-center gap-3 {isMobile ? 'flex-wrap' : ''}">
							<button
								class="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-300 transition-colors font-semibold {isMobile
									? 'text-sm'
									: ''}"
								on:click={goBack}
							>
								<ChevronLeft size={isMobile ? 16 : 20} />
								Back
							</button>
							{#if !isMobile}
								<div class="h-6 w-px bg-gray-300"></div>
							{/if}
							<nav class="flex items-center gap-2 {isMobile ? 'flex-wrap' : ''}">
								{#each breadcrumbs as breadcrumb, i}
									<span
										class="text-gray-700 font-semibold {i === breadcrumbs.length - 1
											? 'text-[#6B9AD9]'
											: ''} {isMobile ? 'text-sm' : ''}"
									>
										{breadcrumb.name}
									</span>
									{#if i < breadcrumbs.length - 1}
										<span class="text-gray-400">/</span>
									{/if}
								{/each}
							</nav>
						</div>

						<div class="flex {isMobile ? 'flex-col w-full' : 'gap-2'} gap-2">
							<button
								class="flex items-center gap-2 px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-blue-600 border-2 border-blue-600 transition-colors font-semibold {isMobile
									? 'justify-center w-full'
									: ''}"
								on:click={openUploader}
							>
								<Upload size={16} />
								Upload Files
							</button>
							<button
								class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 border-2 border-green-600 transition-colors font-semibold {isMobile
									? 'justify-center w-full'
									: ''}"
								on:click={() => (showCreateFolderModal = true)}
							>
								<Plus size={16} />
								New Folder
							</button>
						</div>
					</div>
				</div>

				<!-- File Explorer -->
				<FileSystemExplorer
					items={currentFolder.children || []}
					{projectId}
					on:itemClick={(e) => handleItemClick(e.detail)}
					on:refresh={handleRefresh}
				/>
			{:else}
				<!-- Root Files View with same style exact as General Files -->
				<div class="space-y-4">
					<!-- Header identical -->
					<div class="flex {isMobile ? 'flex-col' : 'items-center justify-between'} mb-6 gap-4">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 bg-[#6B9AD9] rounded-[8px] flex items-center justify-center">
								<Folder size={20} class="text-white" />
							</div>
							<div>
								<h2 class="text-{isMobile ? 'lg' : 'xl'} font-bold text-gray-700">
									FILE STRUCTURE
								</h2>
								<p class="text-sm text-gray-500">Organize your project files</p>
							</div>
						</div>
						<button
							class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 border-2 border-green-600 transition-colors font-semibold {isMobile
								? 'justify-center w-full'
								: ''}"
							on:click={() => (showCreateFolderModal = true)}
						>
							<Plus size={16} />
							Custom Folder
						</button>
					</div>

					<!-- Default Folders with same style -->
					<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
						<h3 class="font-bold text-lg mb-4 flex items-center gap-2">
							<Folder class="text-[#6B9AD9]" size={20} />
							DEFAULT FOLDERS
						</h3>
						<div class="grid {gridCols} gap-{isMobile ? '3' : '4'}">
							{#each defaultFolders as folderType}
								{@const folder = getFolderByName(folderType.name)}
								<button
									class="p-{isMobile
										? '4'
										: '6'} bg-gradient-to-br from-white to-gray-50 border-2 border-gray-300 rounded-[10px] hover:border-[#6B9AD9] transition-all duration-300 text-left group"
									on:click={() => {
										if (folder) {
											navigateToFolder(folder);
										}
									}}
								>
									<div class="flex items-center gap-{isMobile ? '3' : '4'}">
										<div
											class="p-{isMobile
												? '2'
												: '3'} {folderType.color} text-white rounded-[8px] group-hover:scale-110 transition-transform"
										>
											<svelte:component this={folderType.icon} size={isMobile ? 20 : 24} />
										</div>
										<div class="flex-1 min-w-0">
											<h3 class="font-bold {isMobile ? 'text-base' : 'text-lg'} text-gray-700">
												{folderType.name}
											</h3>
											<p
												class="text-{isMobile ? 'xs' : 'sm'} text-gray-500 {isMobile
													? 'truncate'
													: ''}"
											>
												{#if folderType.name === 'Scores'}
													{getPieceCount()} piece{getPieceCount() !== 1 ? 's' : ''}
													{#if getFileCount(folder) > 0 && !isMobile}
														• {getFileCount(folder)} file{getFileCount(folder) !== 1 ? 's' : ''}
													{/if}
												{:else}
													{getFileCount(folder)} file{getFileCount(folder) !== 1 ? 's' : ''}
												{/if}
											</p>
										</div>
									</div>
								</button>
							{/each}
						</div>
					</div>

					<!-- Custom Folders -->
					{#if fileStructure?.customFolders && fileStructure.customFolders.length > 0}
						<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
							<h3 class="font-bold text-lg mb-4 flex items-center gap-2">
								<Package class="text-purple-600" size={20} />
								CUSTOM FOLDERS
							</h3>
							<div class="grid {customGridCols} gap-{isMobile ? '3' : '4'}">
								{#each fileStructure.customFolders as folder}
									<button
										class="p-4 bg-gradient-to-br from-[#6CB1C8] to-[#5077BA] text-white rounded-[10px] hover:from-[#5a9bb4] hover:to-[#4563a0] transition-all duration-300 text-left border-2 border-blue-600"
										on:click={() => navigateToFolder(folder)}
									>
										<div class="flex items-center gap-3">
											<div
												class="w-10 h-10 bg-white bg-opacity-20 rounded-[8px] flex items-center justify-center"
											>
												<Folder size={isMobile ? 20 : 24} />
											</div>
											<div class="flex-1 min-w-0">
												<h4 class="font-bold {isMobile ? 'text-sm' : ''} truncate">
													{folder.name}
												</h4>
												<p class="text-{isMobile ? 'xs' : 'sm'} opacity-80">
													{getFileCount(folder)} file{getFileCount(folder) !== 1 ? 's' : ''}
												</p>
											</div>
										</div>
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Upload to Root -->
					<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
						<div class="text-center">
							<div
								class="w-16 h-16 bg-[#6B9AD9] bg-opacity-10 rounded-[10px] flex items-center justify-center mx-auto mb-4"
							>
								<Upload class="text-[#6B9AD9]" size={32} />
							</div>
							<h3 class="font-bold text-lg text-gray-700 mb-2">UPLOAD TO PROJECT ROOT</h3>
							<p class="text-gray-500 mb-4 {isMobile ? 'text-sm' : ''}">
								Add files directly to the project's main directory
							</p>
							<button
								class="flex items-center gap-2 px-6 py-3 bg-[#6B9AD9] text-white rounded-lg hover:bg-blue-600 border-2 border-blue-600 transition-colors font-semibold {isMobile
									? 'w-full justify-center'
									: 'mx-auto'}"
								on:click={openUploader}
							>
								<Upload size={20} />
								<span class={isMobile ? 'text-sm' : ''}>Upload Files to Project Root</span>
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

{#if showUploader}
	<FileUploader
		on:upload={(e) => handleUpload(e.detail)}
		on:cancel={() => (showUploader = false)}
	/>
{/if}

{#if showCreateFolderModal}
	<CreateFolderModal
		currentProject={project}
		defaultProjectId={project?.id || null}
		defaultPieceId={currentFolder?.pieceId || null}
		lockProject={true}
		on:create={(e) => handleCreateFolder(e.detail)}
		on:cancel={() => (showCreateFolderModal = false)}
	/>
{/if}

<!-- CSS Styles identical -->
<style>
	/* Mobile-specific responsive adjustments - EXACT COPY from files page */
	@media (max-width: 768px) {
		:global(.grid-cols-4) {
			grid-template-columns: repeat(1, minmax(0, 1fr));
		}
		:global(.grid-cols-3) {
			grid-template-columns: repeat(1, minmax(0, 1fr));
		}
		:global(.grid-cols-2) {
			grid-template-columns: repeat(1, minmax(0, 1fr));
		}

		:global(.space-x-8) > :not([hidden]) ~ :not([hidden]) {
			margin-left: 0;
		}

		:global(.gap-4) {
			gap: 0.75rem;
		}

		:global(.gap-3) {
			gap: 0.5rem;
		}
	}

	/* Tablet adjustments - EXACT COPY */
	@media (min-width: 769px) and (max-width: 1024px) {
		:global(.grid-cols-4) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		:global(.grid-cols-3) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	/* Improve touch targets on mobile - EXACT COPY */
	@media (max-width: 768px) {
		button {
			min-height: 44px;
		}

		.group:hover {
			transform: none;
		}

		.group-hover\:scale-110 {
			transition: none;
		}
	}
</style>
