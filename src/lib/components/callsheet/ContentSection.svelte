<script lang="ts">
	import type { Callsheet } from '$lib/types/Callsheet';

	export let callsheet: Callsheet;

	let blocks = [...(callsheet.contents || [])].sort((a, b) => a.position - b.position);

	const token = localStorage.getItem('token'); // ou sessionStorage.getItem('token')
</script>

{#if blocks.length > 0}
	<div class="space-y-6">
		{#each blocks as content (content.id)}
			<div class="mb-4 p-4 bg-white dark:bg-gray-800">
				<h2 class="text-2xl font-bold text-blue-900 dark:text-white mb-2 text-center">
					{@html content.title}
				</h2>
				<div class="prose dark:prose-invert max-w-none">{@html content.text}</div>
			</div>
		{/each}
	</div>
{/if}