<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Search, X } from 'lucide-svelte';

	const dispatch = createEventDispatcher();

	export let value = '';
	export let placeholder = 'Search files and folders...';
	export let disabled = false;

	let inputElement: HTMLInputElement;

	function handleInput() {
		dispatch('search', value);
	}

	function clearSearch() {
		value = '';
		dispatch('search', '');
		inputElement.focus();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			clearSearch();
		}
	}
</script>

<div class="relative">
	<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
		<Search class="h-5 w-5 text-gray-400" />
	</div>

	<input
		bind:this={inputElement}
		bind:value
		type="text"
		{placeholder}
		{disabled}
		class="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#6B9AD9] focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
		on:input={handleInput}
		on:keydown={handleKeydown}
	/>

	{#if value}
		<div class="absolute inset-y-0 right-0 pr-3 flex items-center">
			<button
				type="button"
				class="p-1 rounded-full hover:bg-gray-100 transition-colors"
				on:click={clearSearch}
			>
				<X class="h-4 w-4 text-gray-400" />
			</button>
		</div>
	{/if}
</div>
