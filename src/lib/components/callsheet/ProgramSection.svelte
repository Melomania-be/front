<script lang="ts">
	import type { Callsheet } from '$lib/types/Callsheet';
	import Accordion from '$lib/components/Accordion.svelte';
	export let callsheet: Callsheet;
</script>

<div class="mb-10 py-8 text-center">
	<h2 class="text-2xl font-bold text-slate-500 dark:text-white mb-4">
		Program and scores
	</h2>

	<!-- Scroll horizontal sur petits écrans -->
	<div class="overflow-x-auto border border-gray-300 dark:border-gray-600 rounded-xl max-w-3xl mx-auto">
		<table class="min-w-[400px] w-full table-auto text-left text-sm">
			<thead class="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white">
			<tr>
				<th class="px-4 sm:px-8 py-2 font-semibold whitespace-nowrap">Composer</th>
				<th class="px-4 sm:px-8 py-2 font-semibold whitespace-nowrap">Name</th>
			</tr>
			</thead>
			<tbody class="bg-white dark:bg-gray-700 text-gray-800 dark:text-white">
			{#each callsheet.project?.pieces || [] as piece}
				<tr class="border-t border-gray-300 dark:border-gray-600">
					<td class="px-4 sm:px-8 py-2 align-top whitespace-nowrap">{piece.composer.shortName}</td>
					<td class="px-4 sm:px-8 py-2 align-top">{piece.name}</td>
				</tr>
			{/each}
			</tbody>
		</table>
	</div>
</div>

