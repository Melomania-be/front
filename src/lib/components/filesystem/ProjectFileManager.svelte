<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { Music, Image, Video, FileText, Folder, Plus, Upload, Download, Trash2, ChevronLeft } from 'lucide-svelte';
	import type { ProjectFileStructure, FileSystemItem } from '$lib/types/FileSystem';
	import FileSystemExplorer from './FileSystemExplorer.svelte';
	import FileUploader from './FileUploader.svelte';

	const dispatch = createEventDispatcher();

	export let project: any;

	let fileStructure: ProjectFileStructure | null = null;
	let currentFolder: FileSystemItem | null = null;
	let isLoading = true;
	let showUploader = false;
	let breadcrumbs: { id: number; name: string }[] = [];

	const defaultFolders = [
		{ name: 'Scores', icon: Music, color: 'bg-green-500' },
		{ name: 'Photos', icon: Image, color: 'bg-blue-500' },
		{ name: 'Videos', icon: Video, color: 'bg-red-500' },
		{ name: 'Documents', icon: FileText, color: 'bg-yellow-500' }
	];

	onMount(async () => {
		await loadProjectStructure();
		isLoading = false;
	});

	async function loadProjectStructure() {
		try {
			const response = await fetch(`/api/filesystem/projects/${project.id}`);
			if (response.ok) {
				fileStructure = await response.json();
				console.log('Project structure loaded:', fileStructure);
			} else {
				// Initialize structure if doesn't exist
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
				console.log('Project structure initialized:', fileStructure);
			}
		} catch (error) {
			console.error('Error initializing project structure:', error);
		}
	}

	async function navigateToFolder(folder: FileSystemItem) {
		currentFolder = folder;
		buildBreadcrumbs(folder);

		// Load folder contents
		try {
			const response = await fetch(`/api/filesystem/folders/${folder.id}/contents`);
			if (response.ok) {
				const contents = await response.json();
				// Convert to FileSystemItem format
				folder.children = contents.map(item => ({
					...item,
					updatedAt: new Date(item.updatedAt),
					createdAt: new Date(item.createdAt)
				}));
				// Force reactivity
				currentFolder = { ...currentFolder };
				console.log('Folder contents loaded:', contents);
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
			// Find parent in structure
			if (current.parentId) {
				// This would need to be implemented to traverse back up
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

	// ✅ CORRECTION : Upload avec rafraîchissement automatique
	async function handleUpload(files: FileList) {
		const formData = new FormData();

		// Add files with correct name
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
			console.log('Uploading files to project folder...');
			const response = await fetch('/api/filesystem/upload', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (response.ok && result.success) {
				console.log('Upload successful:', result.message);

				// ✅ CORRECTION : Rafraîchir selon le contexte
				if (currentFolder) {
					// Recharger le contenu du dossier actuel
					await navigateToFolder(currentFolder);
				} else {
					// Recharger toute la structure du projet
					await loadProjectStructure();
					// Force reactivity pour mettre à jour les compteurs
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
			// Navigate to parent folder
			const parentBreadcrumb = breadcrumbs[breadcrumbs.length - 2];
			// This would need proper implementation to find parent folder
			console.log('Going back to:', parentBreadcrumb);
		} else {
			currentFolder = null;
			breadcrumbs = [];
		}
	}

	function handleItemClick(item: FileSystemItem) {
		if (item.type === 'folder') {
			navigateToFolder(item);
		} else {
			// Handle file click - maybe preview or download
			console.log('File clicked:', item.name);
		}
	}

	// ✅ CORRECTION : Fonction de rafraîchissement améliorée
	async function handleRefresh() {
		if (currentFolder) {
			await navigateToFolder(currentFolder);
		} else {
			await loadProjectStructure();
			// Force reactivity
			fileStructure = { ...fileStructure };
		}
	}

	// Helper function to get folder by name from structure
	function getFolderByName(name: string): FileSystemItem | null {
		if (!fileStructure || !fileStructure.rootFolder.children) return null;

		return fileStructure.rootFolder.children.find(f => f.name === name) || null;
	}

	// ✅ CORRECTION : Comptage récursif des fichiers
	function getFileCount(folder: FileSystemItem | null): number {
		if (!folder?.children) return 0;

		let count = 0;
		for (const child of folder.children) {
			if (child.type === 'file') {
				count++;
			} else if (child.type === 'folder' && child.children) {
				count += getFileCount(child); // Récursif pour les sous-dossiers
			}
		}
		return count;
	}

	// Helper function to get piece count for scores folder
	function getPieceCount(): number {
		const scoresFolder = getFolderByName('Scores');
		if (!scoresFolder?.children) return 0;
		return scoresFolder.children.filter(item => item.type === 'folder').length;
	}

	// ✅ AJOUT : Fonction pour créer un dossier à la racine
	async function createRootFolder(name: string) {
		try {
			const response = await fetch('/api/filesystem/folders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name,
					projectId: project.id // Pas de parentId = dossier racine
				})
			});

			if (response.ok) {
				await loadProjectStructure();
				// Force reactivity
				fileStructure = { ...fileStructure };
			}
		} catch (error) {
			console.error('Error creating root folder:', error);
		}
	}
</script>

<div class="space-y-4">
	{#if isLoading}
		<div class="flex justify-center items-center h-64">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B9AD9]"></div>
		</div>
	{:else if currentFolder}
		<!-- Folder View -->
		<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
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
				on:itemClick={(e) => handleItemClick(e.detail)}
				on:refresh={handleRefresh}
			/>
		</div>
	{:else}
		<!-- Root View -->
		<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
			<div class="flex items-center justify-between mb-6">
				<h2 class="text-xl font-bold text-gray-700 uppercase">PROJECT FILES</h2>
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

			<!-- Default Folders -->
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
										{getPieceCount()} piece{getPieceCount() !== 1 ? 's' : ''}
									{:else}
										{getFileCount(folder)} file{getFileCount(folder) !== 1 ? 's' : ''}
									{/if}
								</p>
							</div>
						</div>
					</button>
				{/each}
			</div>

			<!-- Custom Folders -->
			{#if fileStructure?.customFolders && fileStructure.customFolders.length > 0}
				<div class="border-t-2 border-[#E7E7E7] pt-6">
					<h3 class="font-bold text-lg text-gray-700 mb-4">CUSTOM FOLDERS</h3>
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
											{getFileCount(folder)} file{getFileCount(folder) !== 1 ? 's' : ''}
										</p>
									</div>
								</div>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Upload to root button -->
			<div class="border-t-2 border-[#E7E7E7] pt-6 text-center">
				<button
					class="flex items-center gap-2 px-6 py-3 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors mx-auto"
					on:click={openUploader}
				>
					<Upload size={20} />
					Upload Files to Project Root
				</button>
			</div>
		</div>
	{/if}
</div>

{#if showUploader}
	<FileUploader
		on:upload={(e) => handleUpload(e.detail)}
		on:cancel={() => showUploader = false}
	/>
{/if}