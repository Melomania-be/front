<!-- src/lib/components/filesystem/ProjectFileManager.svelte - Version corrigée -->
<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { Music, Image, Video, FileText, Folder, Plus, Upload, ChevronLeft, Package } from 'lucide-svelte';
	import type { ProjectFileStructure, FileSystemItem } from '$lib/types/FileSystem';
	import FileSystemExplorer from './FileSystemExplorer.svelte';
	import FileUploader from './FileUploader.svelte';
	import MinimalMaterialsManager from '../materials/MinimalMaterialsManager.svelte';

	const dispatch = createEventDispatcher();

	export let project: any;

	let fileStructure: ProjectFileStructure | null = null;
	let currentFolder: FileSystemItem | null = null;
	let isLoading = true;
	let showUploader = false;
	let breadcrumbs: { id: number; name: string }[] = [];
	let activeTab: 'materials' | 'files' = 'materials';

	const defaultFolders = [
		{ name: 'Scores', icon: Music, color: 'bg-green-500' },
		{ name: 'Photos', icon: Image, color: 'bg-blue-500' },
		{ name: 'Videos', icon: Video, color: 'bg-red-500' },
		{ name: 'Documents', icon: FileText, color: 'bg-yellow-500' }
	];

	onMount(async () => {
		await loadProjectStructure();
		isLoading = false;

		// Écouter les changements de matériels
		const handleMaterialsUpdated = () => {
			if (currentFolder) {
				navigateToFolder(currentFolder);
			}
		};

		window.addEventListener('materialSelectionChanged', handleMaterialsUpdated);

		return () => {
			window.removeEventListener('materialSelectionChanged', handleMaterialsUpdated);
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
				const contents = await response.json();

				folder.children = contents.map(item => ({
					...item,
					updatedAt: new Date(item.updatedAt),
					createdAt: new Date(item.createdAt)
				}));

				currentFolder = { ...currentFolder };
			}
		} catch (error) {
			console.error('Error loading folder contents:', error);
		}
	}

	function buildBreadcrumbs(folder: FileSystemItem) {
		breadcrumbs = [];
		let current = folder;

		while (current) {
			breadcrumbs.unshift({ id: current.id, name: current.name });
			if (current.parentId) {
				break;
			}
			current = null;
		}
	}

	async function createFolder(name: string) {
		if (!currentFolder) return;

		try {
			const response = await fetch('/api/filesystem/folders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name,
					parentId: currentFolder.id,
					projectId: project.id
				})
			});

			if (response.ok) {
				await navigateToFolder(currentFolder);
			}
		} catch (error) {
			console.error('Error creating folder:', error);
		}
	}

	function openUploader() {
		showUploader = true;
	}

	async function handleUpload(files: FileList) {
		const formData = new FormData();

		if (files.length === 1) {
			formData.append('file', files[0]);
		} else {
			Array.from(files).forEach(file => {
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
					fileStructure = { ...fileStructure };
				}

				showUploader = false;
			} else {
				console.error('Upload failed:', result.error);
				alert('Upload failed: ' + (result.error || 'Unknown error'));
			}
		} catch (error) {
			console.error('Error uploading files:', error);
			alert('Error uploading files: ' + error.message);
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
			fileStructure = { ...fileStructure };
		}
	}

	async function createRootFolder(name: string) {
		try {
			const response = await fetch('/api/filesystem/folders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name,
					projectId: project.id
				})
			});

			if (response.ok) {
				await loadProjectStructure();
				fileStructure = { ...fileStructure };
			}
		} catch (error) {
			console.error('Error creating root folder:', error);
		}
	}

	function getFolderByName(name: string): FileSystemItem | null {
		if (!fileStructure || !fileStructure.rootFolder.children) return null;
		return fileStructure.rootFolder.children.find(f => f.name === name) || null;
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
		return scoresFolder.children.filter(item => item.type === 'folder').length;
	}

	function handleMaterialsUpdated() {
		dispatch('materialsUpdated');

		// Forcer le rafraîchissement de l'explorateur de fichiers
		if (currentFolder) {
			navigateToFolder(currentFolder);
		}
	}
</script>

<div class="space-y-4">
	{#if isLoading}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B9AD9]"></div>
		</div>
	{:else}
		<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
			<div class="border-b border-gray-200 mb-6">
				<nav class="flex space-x-8">
					<button
						class="py-2 px-1 border-b-2 font-medium text-sm transition-colors {
							activeTab === 'materials'
								? 'border-[#6B9AD9] text-[#6B9AD9]'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						}"
						on:click={() => activeTab = 'materials'}
					>
						<div class="flex items-center gap-2">
							<Package size={16} />
							Gestion des matériels
						</div>
					</button>

					<button
						class="py-2 px-1 border-b-2 font-medium text-sm transition-colors {
							activeTab === 'files'
								? 'border-[#6B9AD9] text-[#6B9AD9]'
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
						}"
						on:click={() => activeTab = 'files'}
					>
						<div class="flex items-center gap-2">
							<Folder size={16} />
							Arborescence des fichiers
						</div>
					</button>
				</nav>
			</div>

			{#if activeTab === 'materials'}
				<MinimalMaterialsManager
					projectId={project.id}
					on:materialsUpdated={handleMaterialsUpdated}
				/>
			{:else if currentFolder}
				<div class="flex items-center justify-between mb-6">
					<div class="flex items-center gap-3">
						<button
							class="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
							on:click={goBack}
						>
							<ChevronLeft size={20} />
							Back
						</button>
						<div class="h-6 w-px bg-gray-300"></div>
						<nav class="flex items-center gap-2">
							{#each breadcrumbs as breadcrumb, i}
								<span class="text-gray-700 {i === breadcrumbs.length - 1 ? 'font-bold' : ''}">
									{breadcrumb.name}
								</span>
								{#if i < breadcrumbs.length - 1}
									<span class="text-gray-400">/</span>
								{/if}
							{/each}
						</nav>
					</div>

					<div class="flex gap-2">
						<button
							class="flex items-center gap-2 px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors"
							on:click={openUploader}
						>
							<Upload size={16} />
							Upload
						</button>
						<button
							class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
							on:click={() => {
								const name = prompt('Folder name:');
								if (name) createFolder(name);
							}}
						>
							<Plus size={16} />
							New Folder
						</button>
					</div>
				</div>

				<FileSystemExplorer
					items={currentFolder.children || []}
					projectId={project.id}
					on:itemClick={(e) => handleItemClick(e.detail)}
					on:refresh={handleRefresh}
				/>
			{:else}
				<div class="flex items-center justify-between mb-6">
					<h2 class="text-xl font-bold text-gray-700 uppercase">ARBORESCENCE DES FICHIERS</h2>
					<button
						class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
						on:click={() => {
							const name = prompt('Custom folder name:');
							if (name) createRootFolder(name);
						}}
					>
						<Plus size={16} />
						Custom Folder
					</button>
				</div>

				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
					{#each defaultFolders as folderType}
						{@const folder = getFolderByName(folderType.name)}
						<button
							class="p-6 bg-gradient-to-br from-white to-gray-50 border-2 border-[#E7E7E7] rounded-xl hover:border-[#6B9AD9] transition-all duration-300 text-left group"
							on:click={() => {
								if (folder) {
									navigateToFolder(folder);
								}
							}}
						>
							<div class="flex items-center gap-4">
								<div class="p-3 {folderType.color} text-white rounded-lg group-hover:scale-110 transition-transform">
									<svelte:component this={folderType.icon} size={24} />
								</div>
								<div>
									<h3 class="font-semibold text-lg text-gray-700">{folderType.name}</h3>
									<p class="text-sm text-gray-500">
										{#if folderType.name === 'Scores'}
											{getPieceCount()} pièce{getPieceCount() !== 1 ? 's' : ''}
											{#if getFileCount(folder) > 0}
												• {getFileCount(folder)} fichier{getFileCount(folder) !== 1 ? 's' : ''}
											{/if}
										{:else}
											{getFileCount(folder)} fichier{getFileCount(folder) !== 1 ? 's' : ''}
										{/if}
									</p>
								</div>
							</div>
						</button>
					{/each}
				</div>

				{#if fileStructure?.customFolders && fileStructure.customFolders.length > 0}
					<div class="border-t-2 border-[#E7E7E7] pt-6">
						<h3 class="font-bold text-lg text-gray-700 mb-4">DOSSIERS PERSONNALISÉS</h3>
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each fileStructure.customFolders as folder}
								<button
									class="p-4 bg-gradient-to-br from-[#6CB1C8] to-[#5077BA] text-white rounded-lg hover:from-[#5a9bb4] hover:to-[#4563a0] transition-all duration-300 text-left"
									on:click={() => navigateToFolder(folder)}
								>
									<div class="flex items-center gap-3">
										<Folder size={24} />
										<div>
											<h4 class="font-semibold">{folder.name}</h4>
											<p class="text-sm opacity-80">
												{getFileCount(folder)} fichier{getFileCount(folder) !== 1 ? 's' : ''}
											</p>
										</div>
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/if}

				<div class="border-t-2 border-[#E7E7E7] pt-6 text-center">
					<button
						class="flex items-center gap-2 px-6 py-3 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors mx-auto"
						on:click={openUploader}
					>
						<Upload size={20} />
						Upload Files to Project Root
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

{#if showUploader}
	<FileUploader
		on:upload={(e) => handleUpload(e.detail)}
		on:cancel={() => showUploader = false}
	/>
{/if}