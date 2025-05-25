<script lang="ts">
	import type { Callsheet } from '$lib/types/Callsheet';
	import { dndzone } from 'svelte-dnd-action';

	export let callsheet: Callsheet;

	let blocks = [...(callsheet.contents || [])].sort((a, b) => a.position - b.position);

	const token = localStorage.getItem('token') // ou sessionStorage.getItem('token')


	async function handleDnd({ detail }) {
		blocks = detail.items.map((block, index) => ({
			...block,
			position: index,
		}));

		// Appel backend pour sauvegarder le nouvel ordre

		await fetch(`http://localhost:3333/projects/${callsheet.projectId}/management/call_sheets/${callsheet.id}/contents/reorder`, {

			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,

			},
			body: JSON.stringify({ contents: blocks }),
			credentials: 'include', // ← très important pour envoyer les cookies
		});
	}
</script>

{#if blocks.length > 0}
	<div
		use:dndzone={{ items: blocks, flipDurationMs: 200 }}
		on:consider={handleDnd}
		on:finalize={handleDnd}
		class="space-y-6"
	>
		{#each blocks as content (content.id)}
			<div class="mb-4 p-4 border rounded bg-white dark:bg-gray-800 cursor-move shadow">
				<h2 class="text-2xl font-bold text-blue-900 dark:text-white underline mb-2">
					{@html content.title}
				</h2>
				<div class="prose dark:prose-invert max-w-none">{@html content.text}</div>
			</div>
		{/each}
	</div>
{/if}
