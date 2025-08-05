<!-- src/routes/files/+page.svelte - Design uniforme avec auditions -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import FileSystemExplorer from '$lib/components/filesystem/FileSystemExplorer.svelte';
	import FileSystemHeader from '$lib/components/filesystem/FileSystemHeader.svelte';
	import ProjectFileManager from '$lib/components/filesystem/ProjectFileManager.svelte';
	import FileUploader from '$lib/components/filesystem/FileUploader.svelte';
	import type { FileSystemItem, ProjectFileStructure } from '$lib/types/FileSystem';
	import { Folder, FolderOpen, Plus, Upload, ChevronLeft, Database } from 'lucide-svelte';

	let activeTab: 'projects' | 'general' = 'projects';
	let projects: any[] = [];
	let selectedProject: any = null;
	let generalFiles: FileSystemItem[] = [];
	let currentGeneralFolder: FileSystemItem | null = null;
	let isLoading = true;
	let isMobile = false;
	let showGeneralUploader = false;
	let generalBreadcrumbs: { id: number; name: string }[] = [];

	const checkMobile = () => {
		if (browser) {
			isMobile = window.innerWidth <= 1000;
		}
	};

	onMount(async () => {
		checkMobile();
		if (browser) {
			window.addEventListener('resize', checkMobile);
		}

		await loadProjects();
		await loadGeneralFiles();
		isLoading = false;

		return () => {
			if (browser) {
				window.removeEventListener('resize', checkMobile);
			}
		};
	});

	async function loadProjects() {
		try {
			// Essayer d'abord avec les paramètres complets
			let response = await fetch('/api/projects?limit=1000&page=1&filter=&orderBy=name&order=asc');

			if (!response.ok) {
				// Fallback: essayer avec des paramètres minimaux
				response = await fetch('/api/projects?page=1&limit=1000');
			}

			if (response.ok) {
				const data = await response.json();
				projects = data.data || data || [];
			} else {
				console.error('Failed to load projects:', response.status, response.statusText);
				projects = [];
			}
		} catch (error) {
			console.error('Error loading projects:', error);
			projects = [];
		}
	}

	async function loadGeneralFiles() {
		try {
			const response = await fetch('/api/filesystem/general');
			if (response.ok) {
				const data = await response.json();

				// Adapter la structure des données
				generalFiles = Array.isArray(data) ? data.map(item => ({
					...item,
					updatedAt: new Date(item.updatedAt),
					createdAt: new Date(item.createdAt)
				})) : [];
			}
		} catch (error) {
			console.error('Error loading general files:', error);
			generalFiles = [];
		}
	}

	function selectProject(project: any) {
		selectedProject = project;
		// Reset general folder navigation when switching to projects
		currentGeneralFolder = null;
		generalBreadcrumbs = [];
	}

	// Navigation dans les dossiers généraux
	async function navigateToGeneralFolder(folder: FileSystemItem) {
		currentGeneralFolder = folder;
		buildGeneralBreadcrumbs(folder);

		// Load folder contents
		try {
			const response = await fetch(`/api/filesystem/folders/${folder.id}/contents`);
			if (response.ok) {
				const contents = await response.json();
				folder.children = contents.map(item => ({
					...item,
					updatedAt: new Date(item.updatedAt),
					createdAt: new Date(item.createdAt)
				}));
				// Force reactivity
				currentGeneralFolder = { ...currentGeneralFolder };
			}
		} catch (error) {
			console.error('Error loading general folder contents:', error);
		}
	}

	function buildGeneralBreadcrumbs(folder: FileSystemItem) {
		generalBreadcrumbs = [];
		let current = folder;

		while (current) {
			generalBreadcrumbs.unshift({ id: current.id, name: current.name });
			// Find parent in structure - this would need proper implementation
			if (current.parentId) {
				break;
			}
			current = null;
		}
	}

	function goBackGeneral() {
		if (generalBreadcrumbs.length > 1) {
			// Navigate to parent folder - needs proper implementation
		} else {
			currentGeneralFolder = null;
			generalBreadcrumbs = [];
		}
	}

	// Upload pour fichiers généraux
	async function handleGeneralUpload(files: FileList) {
		const formData = new FormData();

		// Add files
		if (files.length === 1) {
			formData.append('file', files[0]);
		} else {
			Array.from(files).forEach(file => {
				formData.append('files', file);
			});
		}

		// Add folder context if in a folder
		if (currentGeneralFolder) {
			formData.append('parentId', currentGeneralFolder.id.toString());
		}

		try {
			const response = await fetch('/api/filesystem/upload', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (response.ok && result.success) {
				// Refresh appropriately
				if (currentGeneralFolder) {
					await navigateToGeneralFolder(currentGeneralFolder);
				} else {
					await loadGeneralFiles();
				}

				showGeneralUploader = false;
			} else {
				console.error('General upload failed:', result.error);
				alert('Upload failed: ' + (result.error || 'Unknown error'));
			}
		} catch (error) {
			console.error('Error uploading general files:', error);
			alert('Error uploading files: ' + error.message);
		}
	}

	// Créer un dossier général
	async function handleCreateGeneralFolder(name: string) {
		try {
			const body = { name };

			// Add parent context if in a folder
			if (currentGeneralFolder) {
				body.parentId = currentGeneralFolder.id;
			}

			const response = await fetch('/api/filesystem/folders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			if (response.ok) {
				// Refresh appropriately
				if (currentGeneralFolder) {
					await navigateToGeneralFolder(currentGeneralFolder);
				} else {
					await loadGeneralFiles();
				}
			}
		} catch (error) {
			console.error('Error creating general folder:', error);
		}
	}

	function handleGeneralItemClick(item: FileSystemItem) {
		if (item.type === 'folder') {
			navigateToGeneralFolder(item);
		}
	}

	async function handleGeneralRefresh() {
		if (currentGeneralFolder) {
			await navigateToGeneralFolder(currentGeneralFolder);
		} else {
			await loadGeneralFiles();
		}
	}
</script>

<div class="bg-[#E7E7E7] min-h-screen {isMobile ? 'pb-16' : ''}">
	<!-- Header -->
	<FileSystemHeader
		{activeTab}
		{selectedProject}
		on:tabChange={(e) => {
			activeTab = e.detail;
			// Reset navigation when switching tabs
			if (activeTab === 'general') {
				selectedProject = null;
			} else {
				currentGeneralFolder = null;
				generalBreadcrumbs = [];
			}
		}}
		on:projectChange={(e) => selectProject(e.detail)}
		on:refresh={() => {
			if (activeTab === 'projects') {
				loadProjects();
			} else {
				handleGeneralRefresh();
			}
		}}
	/>

	<!-- Main Content -->
	<div class="p-4 space-y-4">
		{#if isLoading}
			<!-- Loading State -->
			<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-6">
				<div class="flex justify-center items-center h-64">
					<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B9AD9]"></div>
					<span class="ml-4 text-gray-600 font-semibold">Loading files...</span>
				</div>
			</div>
		{:else if activeTab === 'projects'}
			{#if selectedProject}
				<ProjectFileManager
					project={selectedProject}
					on:back={() => selectedProject = null}
				/>
			{:else}
				<!-- Project Selection Grid -->
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
					<div class="flex items-center space-x-3 mb-6">
						<div class="flex items-center justify-center w-10 h-10 bg-[#6B9AD9] rounded-[8px]">
							<FolderOpen class="w-5 h-5 text-white" />
						</div>
						<div>
							<h1 class="font-bold text-lg">SELECT A PROJECT</h1>
							<p class="text-sm text-gray-600">Choose a project to manage its files</p>
						</div>
					</div>

					{#if projects.length === 0}
						<div class="text-center py-12">
							<div class="w-16 h-16 bg-gray-100 rounded-[10px] flex items-center justify-center mx-auto mb-4">
								<Folder class="text-gray-400" size={48} />
							</div>
							<h3 class="font-bold text-lg text-gray-700 mb-2">NO PROJECTS FOUND</h3>
							<p class="text-gray-500">Create a project first to manage its files</p>
						</div>
					{:else}
						<div class="grid grid-cols-1 {isMobile ? 'gap-3' : 'md:grid-cols-2 lg:grid-cols-3 gap-4'}">
							{#each projects as project}
								<button
									class="p-4 bg-gradient-to-r from-[#6CB1C8] to-[#5077BA] text-white rounded-[10px] hover:from-[#5a9bb4] hover:to-[#4563a0] transition-all duration-300 text-left border-2 border-blue-600"
									on:click={() => selectProject(project)}
								>
									<div class="flex items-center gap-3">
										<div class="w-12 h-12 bg-white bg-opacity-20 rounded-[8px] flex items-center justify-center">
											<FolderOpen size={24} />
										</div>
										<div class="flex-1 min-w-0">
											<h3 class="font-bold text-lg truncate">{project.name}</h3>
											<p class="text-sm opacity-80">
												{project.pieces?.length || 0} piece{project.pieces?.length !== 1 ? 's' : ''}
											</p>
										</div>
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		{:else}
			<!-- General Files -->
			{#if currentGeneralFolder}
				<!-- Navigation dans les dossiers généraux -->
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
					<div class="flex {isMobile ? 'flex-col' : 'items-center justify-between'} mb-6 gap-4">
						<div class="flex items-center gap-3 {isMobile ? 'flex-wrap' : ''}">
							<button
								class="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-300 transition-colors font-semibold"
								on:click={goBackGeneral}
							>
								<ChevronLeft size={20} />
								Back
							</button>
							<div class="h-6 w-px bg-gray-300"></div>
							<nav class="flex items-center gap-2">
								{#each generalBreadcrumbs as breadcrumb, i}
									<span class="text-gray-700 font-semibold {i === generalBreadcrumbs.length - 1 ? 'text-[#6B9AD9]' : ''}">
										{breadcrumb.name}
									</span>
									{#if i < generalBreadcrumbs.length - 1}
										<span class="text-gray-400">/</span>
									{/if}
								{/each}
							</nav>
						</div>

						<div class="flex {isMobile ? 'flex-col w-full' : 'gap-2'} gap-2">
							<button
								class="flex items-center gap-2 px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-blue-600 border-2 border-blue-600 transition-colors font-semibold {isMobile ? 'justify-center w-full' : ''}"
								on:click={() => showGeneralUploader = true}
							>
								<Upload size={16} />
								Upload
							</button>
							<button
								class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 border-2 border-green-600 transition-colors font-semibold {isMobile ? 'justify-center w-full' : ''}"
								on:click={() => {
									const name = prompt('Folder name:');
									if (name) handleCreateGeneralFolder(name);
								}}
							>
								<Plus size={16} />
								New Folder
							</button>
						</div>
					</div>
				</div>

				<FileSystemExplorer
					items={currentGeneralFolder.children || []}
					on:itemClick={(e) => handleGeneralItemClick(e.detail)}
					on:refresh={handleGeneralRefresh}
				/>
			{:else}
				<!-- Vue racine des fichiers généraux -->
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
					<div class="flex {isMobile ? 'flex-col' : 'items-center justify-between'} mb-6 gap-4">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 bg-[#6B9AD9] rounded-[8px] flex items-center justify-center">
								<Database size={20} class="text-white" />
							</div>
							<div>
								<h1 class="font-bold text-lg">GENERAL FILES</h1>
								<p class="text-sm text-gray-600">Files not associated with any project</p>
							</div>
						</div>
						<div class="flex {isMobile ? 'flex-col w-full' : 'gap-2'} gap-2">
							<button
								class="flex items-center gap-2 px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-blue-600 border-2 border-blue-600 transition-colors font-semibold {isMobile ? 'justify-center w-full' : ''}"
								on:click={() => showGeneralUploader = true}
							>
								<Upload size={16} />
								Upload Files
							</button>
							<button
								class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 border-2 border-green-600 transition-colors font-semibold {isMobile ? 'justify-center w-full' : ''}"
								on:click={() => {
									const name = prompt('Folder name:');
									if (name) handleCreateGeneralFolder(name);
								}}
							>
								<Plus size={16} />
								New Folder
							</button>
						</div>
					</div>

					<FileSystemExplorer
						items={generalFiles}
						on:itemClick={(e) => handleGeneralItemClick(e.detail)}
						on:refresh={handleGeneralRefresh}
					/>
				</div>
			{/if}
		{/if}
	</div>
</div>

{#if showGeneralUploader}
	<FileUploader
		on:upload={(e) => handleGeneralUpload(e.detail)}
		on:cancel={() => showGeneralUploader = false}
	/>
{/if}

<style>
    :global(.grid-cols-auto-fit) {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
        :global(.md\:grid-cols-2) {
            grid-template-columns: repeat(1, minmax(0, 1fr));
        }
        :global(.lg\:grid-cols-3) {
            grid-template-columns: repeat(1, minmax(0, 1fr));
        }

        :global(.gap-4) {
            gap: 0.75rem;
        }

        :global(.gap-3) {
            gap: 0.5rem;
        }

        button {
            min-height: 44px;
        }
    }
</style>