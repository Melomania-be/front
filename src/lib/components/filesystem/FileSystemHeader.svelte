<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { FolderOpen, Database, RefreshCw, ChevronLeft } from 'lucide-svelte';

	const dispatch = createEventDispatcher();

	export let activeTab: 'projects' | 'general';
	export let selectedProject: any = null;

	function switchTab(tab: 'projects' | 'general') {
		activeTab = tab;
		dispatch('tabChange', tab);
	}
</script>

<div class="bg-white border-b-2 border-[#8C8C8C] p-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-4">
			{#if selectedProject}
				<button
					class="flex items-center gap-2 text-gray-600 hover:text-gray-800"
					on:click={() => dispatch('projectChange', null)}
				>
					<ChevronLeft size={20} />
					Back to Projects
				</button>
				<div class="h-6 w-px bg-gray-300"></div>
				<h1 class="text-2xl font-bold text-gray-700">
					{selectedProject.name} - Files
				</h1>
			{:else}
				<h1 class="text-2xl font-bold text-gray-700">FILE MANAGEMENT</h1>
			{/if}
		</div>

		<div class="flex items-center gap-4">
			<button
				class="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
				on:click={() => dispatch('refresh')}
			>
				<RefreshCw size={20} />
			</button>

			{#if !selectedProject}
				<div class="flex bg-gray-100 rounded-lg p-1">
					<button
						class="flex items-center gap-2 px-4 py-2 rounded-md transition-colors {activeTab === 'projects' ? 'bg-[#6B9AD9] text-white' : 'text-gray-600 hover:text-gray-800'}"
						on:click={() => switchTab('projects')}
					>
						<FolderOpen size={16} />
						Projects
					</button>
					<button
						class="flex items-center gap-2 px-4 py-2 rounded-md transition-colors {activeTab === 'general' ? 'bg-[#6B9AD9] text-white' : 'text-gray-600 hover:text-gray-800'}"
						on:click={() => switchTab('general')}
					>
						<Database size={16} />
						General Files
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>