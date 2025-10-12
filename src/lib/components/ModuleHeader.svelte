<script lang="ts">
	import { RefreshCw } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	export let title: string;
	export let description: string;
	export let icon: any; // Lucide icon component
	export let showRefresh: boolean = true;

	let isMobile = false;

	const checkMobile = () => {
		if (browser) {
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
</script>

<div class="bg-white border-2 border-[#8C8C8C] rounded-[10px] mx-4 mt-4 mb-4 p-4">
	<div class="flex {isMobile ? 'flex-col' : 'items-center justify-between'} gap-4">
		<div class="flex items-center gap-3">
			<div class="w-10 h-10 bg-[#6B9AD9] rounded-[8px] flex items-center justify-center">
				<svelte:component this={icon} size={20} class="text-white" />
			</div>
			<div>
				<h1 class="text-{isMobile ? 'lg' : 'xl'} font-bold text-gray-700 uppercase">{title}</h1>
				<p class="text-sm text-gray-500">{description}</p>
			</div>
		</div>

		{#if showRefresh}
			<div class="flex items-center gap-4">
				<button
					class="p-2 text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 border border-transparent hover:border-gray-300 transition-colors"
					on:click={() => dispatch('refresh')}
					title="Refresh"
				>
					<RefreshCw size={isMobile ? 16 : 20} />
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	@media (max-width: 480px) {
		.text-xl {
			font-size: 1.125rem;
			line-height: 1.75rem;
		}

		.text-lg {
			font-size: 1rem;
			line-height: 1.5rem;
		}
	}
</style>
