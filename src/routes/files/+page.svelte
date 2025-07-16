<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import FileSystemExplorer from '$lib/components/filesystem/FileSystemExplorer.svelte';
	import FileSystemHeader from '$lib/components/filesystem/FileSystemHeader.svelte';
	import ProjectFileManager from '$lib/components/filesystem/ProjectFileManager.svelte';
	import type { FileSystemItem, ProjectFileStructure } from '$lib/types/FileSystem';
	import { Folder, FolderOpen, Plus, Upload } from 'lucide-svelte';

	let activeTab: 'projects' | 'general' = 'projects';
	let projects: any[] = [];
	let selectedProject: any = null;
	let generalFiles: FileSystemItem[] = [];
	let isLoading = true;
	let isMobile = false;

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
				generalFiles = await response.json();
			}
		} catch (error) {
			console.error('Error loading general files:', error);
		}
	}

	function selectProject(project: any) {
		selectedProject = project;
	}

	async function handleGeneralUpload(files: FileList) {
		const formData = new FormData();
		Array.from(files).forEach(file => {
			formData.append('files', file);
		});

		try {
			const response = await fetch('/api/filesystem/upload', {
				method: 'POST',
				body: formData
			});

			if (response.ok) {
				await loadGeneralFiles();
			}
		} catch (error) {
			console.error('Error uploading files:', error);
		}
	}

	async function handleCreateGeneralFolder(name: string) {
		try {
			const response = await fetch('/api/filesystem/folders', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name })
			});

			if (response.ok) {
				await loadGeneralFiles();
			}
		} catch (error) {
			console.error('Error creating folder:', error);
		}
	}
</script>

<div class="min-h-screen bg-[#E7E7E7] {isMobile ? 'pb-16' : ''}">
	<!-- Header -->
	<FileSystemHeader
		{activeTab}
		{selectedProject}
		on:tabChange={(e) => activeTab = e.detail}
		on:projectChange={(e) => selectProject(e.detail)}
		on:refresh={() => {
      if (activeTab === 'projects') {
        loadProjects();
      } else {
        loadGeneralFiles();
      }
    }}
	/>

	<!-- Main Content -->
	<div class="p-4">
		{#if isLoading}
			<div class="flex justify-center items-center h-64">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B9AD9]"></div>
			</div>
		{:else if activeTab === 'projects'}
			{#if selectedProject}
				<ProjectFileManager
					project={selectedProject}
					on:back={() => selectedProject = null}
				/>
			{:else}
				<!-- Project Selection Grid -->
				<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4 mb-4">
					<h2 class="font-bold text-lg uppercase mb-4 text-gray-700">SELECT A PROJECT</h2>

					{#if projects.length === 0}
						<div class="text-center py-8">
							<Folder class="mx-auto mb-4 text-gray-400" size={48} />
							<p class="text-gray-500">No projects found</p>
						</div>
					{:else}
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{#each projects as project}
								<button
									class="p-4 bg-gradient-to-r from-[#6CB1C8] to-[#5077BA] text-white rounded-lg hover:from-[#5a9bb4] hover:to-[#4563a0] transition-all duration-300 text-left"
									on:click={() => selectProject(project)}
								>
									<div class="flex items-center gap-3">
										<FolderOpen size={24} />
										<div>
											<h3 class="font-semibold text-lg">{project.name}</h3>
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
			<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] p-4">
				<div class="flex items-center justify-between mb-4">
					<h2 class="font-bold text-lg uppercase text-gray-700">GENERAL FILES</h2>
					<button class="flex items-center gap-2 px-4 py-2 bg-[#6B9AD9] text-white rounded-lg hover:bg-[#5a9bb4] transition-colors">
						<Upload size={16} />
						Upload Files
					</button>
				</div>

				<FileSystemExplorer
					items={generalFiles}
					on:upload={(e) => handleGeneralUpload(e.detail)}
					on:createFolder={(e) => handleCreateGeneralFolder(e.detail)}
				/>
			</div>
		{/if}
	</div>
</div>

<style>
    :global(.grid-cols-auto-fit) {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    }
</style>