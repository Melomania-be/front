<!-- src/lib/components/filesystem/FileSystemHeader.svelte - English responsive version -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { FolderOpen, Database, RefreshCw, ChevronLeft } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	const dispatch = createEventDispatcher();

	export let activeTab: 'projects' | 'general';
	export let selectedProject: any = null;

	let isMobile = false;
	let windowWidth = 0;

	// Responsive detection
	const checkMobile = () => {
		if (browser) {
			windowWidth = window.innerWidth;
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

	function switchTab(tab: 'projects' | 'general') {
		activeTab = tab;
		dispatch('tabChange', tab);
	}
</script>

<div class="bg-white border-b-2 border-[#8C8C8C] p-4 {isMobile ? 'px-2' : ''}">
	<div class="flex {isMobile ? 'flex-col' : 'items-center justify-between'} gap-4">
		<div class="flex items-center gap-4">
			{#if selectedProject}
				<button
					class="flex items-center gap-2 text-gray-600 hover:text-gray-800 {isMobile ? 'text-sm' : ''}"
					on:click={() => dispatch('projectChange', null)}
				>
					<ChevronLeft size={isMobile ? 16 : 20} />
					Back to Projects
				</button>
				<div class="h-6 w-px bg-gray-300 {isMobile ? 'hidden' : ''}"></div>
				<h1 class="text-{isMobile ? 'lg' : '2xl'} font-bold text-gray-700">
					{selectedProject.name} - Files
				</h1>
			{:else}
				<h1 class="text-{isMobile ? 'lg' : '2xl'} font-bold text-gray-700">FILE MANAGEMENT</h1>
			{/if}
		</div>

		<div class="flex items-center gap-4 {isMobile ? 'w-full justify-between' : ''}">
			<button
				class="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
				on:click={() => dispatch('refresh')}
				title="Refresh"
			>
				<RefreshCw size={isMobile ? 16 : 20} />
			</button>

			{#if !selectedProject}
				<div class="flex bg-gray-100 rounded-lg p-1 {isMobile ? 'flex-1' : ''}">
					<button
						class="flex items-center gap-2 px-{isMobile ? '3' : '4'} py-2 rounded-md transition-colors {
							activeTab === 'projects'
								? 'bg-[#6B9AD9] text-white'
								: 'text-gray-600 hover:text-gray-800'
						} {isMobile ? 'flex-1 justify-center text-sm' : ''}"
						on:click={() => switchTab('projects')}
					>
						<FolderOpen size={16} />
						{#if !isMobile || windowWidth > 480}
							<span>Projects</span>
						{/if}
					</button>
					<button
						class="flex items-center gap-2 px-{isMobile ? '3' : '4'} py-2 rounded-md transition-colors {
							activeTab === 'general'
								? 'bg-[#6B9AD9] text-white'
								: 'text-gray-600 hover:text-gray-800'
						} {isMobile ? 'flex-1 justify-center text-sm' : ''}"
						on:click={() => switchTab('general')}
					>
						<Database size={16} />
						{#if !isMobile || windowWidth > 480}
							<span>General Files</span>
						{/if}
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
    @media (max-width: 480px) {
        .text-2xl {
            font-size: 1.25rem;
            line-height: 1.75rem;
        }

        .text-lg {
            font-size: 1rem;
            line-height: 1.5rem;
        }
    }
</style>