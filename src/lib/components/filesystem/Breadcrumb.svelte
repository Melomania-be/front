<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { ChevronRight, Home } from 'lucide-svelte';
	import type { BreadcrumbItem } from '$lib/types/FileSystem';

	const dispatch = createEventDispatcher();

	export let items: BreadcrumbItem[] = [];
	export let showHome = true;

	function handleItemClick(item: BreadcrumbItem, index: number) {
		dispatch('navigate', { item, index });
	}

	function handleHomeClick() {
		dispatch('home');
	}
</script>

<nav class="flex items-center gap-2 text-sm text-gray-600">
	{#if showHome}
		<button
			class="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
			on:click={handleHomeClick}
		>
			<Home size={16} />
			<span>Home</span>
		</button>

		{#if items.length > 0}
			<ChevronRight size={16} class="text-gray-400" />
		{/if}
	{/if}

	{#each items as item, index}
		<button
			class="px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors {index === items.length - 1 ? 'text-gray-800 font-medium' : 'text-gray-600'}"
			on:click={() => handleItemClick(item, index)}
		>
			{item.name}
		</button>

		{#if index < items.length - 1}
			<ChevronRight size={16} class="text-gray-400" />
		{/if}
	{/each}
</nav>